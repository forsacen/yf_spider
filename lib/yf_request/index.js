const net=require('net')
const url=require('url')
const tls = require('tls')
const zlib = require('zlib')

function releaseSocket(socket){
    if(socket&&!socket.destroyed){
        socket.end()
        socket.destroy()
    }
}

function checkConnectingFromData(data){
    let d=data.toString()
    let header=[]
    let line=''
    for(let i=0;i<d.length;i++){
        line=line+d[i]
        if(d[i]==='\n' && d[i-1]==='\r'){
            header.push(line)
            line=''
        }
    }
    let result={complete:false}
    if(header.length>0){
        let statusCode=parseInt((header[0].split(' '))[1])
        result.statusCode=statusCode
    }
    if(header.length>0 && header[header.length-1]==='\r\n'){
        result.complete=true
    }
    return result
}

function deleteResFields(res){
    delete res._cache
    delete res._chunkLength
    delete res._chunkLength
    delete res._chunkHeader
    delete res._chunkIndex
    delete res._chunkCache
    delete res._chunkBody
    delete res._chunkTail
    delete res._headerComplete
}

function parseHeader(header){
    let headers={}
    let headerInfo=header.split('\r\n')
    let statusCode=parseInt((headerInfo[0].split(' '))[1])
    for(let i=1;i<headerInfo.length;i++){
        let index=headerInfo[i].indexOf(':')
        headers[headerInfo[i].slice(0,index)]=headerInfo[i].slice(index+1).trimLeft()
    }
    return {
        statusCode:statusCode,
        headers:headers,
    }
}

function parseData(res,data,cb){
    for(let i=0;i<data.length;i++){
        if(!res._headerComplete){
            res._cache.push(data[i])
            if(res._cache.length>3&res._cache[res._cache.length-1]===10 && res._cache[res._cache.length-2]===13
                &&res._cache[res._cache.length-3]===10&&res._cache[res._cache.length-4]===13){//'\r\n\r\n'
                res._headerComplete=true
                let result=parseHeader(Buffer.from(res._cache.slice(0,res._cache.length-4)).toString())
                res.statusCode=result.statusCode
                res.headers=result.headers
                res._cache=[]
            }
        }else{
            if('Content-Length' in res.headers){
                res._cache.push(data[i])
                if(res._cache.length>=res.headers['Content-Length']){
                    if(res.headers['Content-Encoding']==='gzip'){
                        zlib.gunzip(Buffer.from(res._cache), function (err, decoded) {
                            res.body=decoded
                            res._complete=true
                            cb(err,res)
                        })
                    }else if(res.headers['Content-Encoding']==='br'){
                        zlib.brotliDecompress(Buffer.from(res._cache), function (err, decoded) {
                            res.body=decoded
                            res._complete=true
                            cb(err,res)
                        })
                    }else{
                        res.body=Buffer.from(res._cache)
                        res._complete=true
                        cb(null,res)
                    }
                    return
                }
            }else if('Transfer-Encoding' in res.headers){
                if(res._chunkHeader){
                    res._chunkCache.push(data[i])
                    if(res._chunkCache.length>1&&res._chunkCache[res._chunkCache.length-1]===10
                        &&res._chunkCache[res._chunkCache.length-2]===13){
                        res._chunkCache.pop()
                        res._chunkCache.pop()
                        res._chunkLength=parseInt(Buffer.from(res._chunkCache).toString(),16)
                        if(res._chunkLength===0){
                            if(res.headers['Content-Encoding']==='gzip'){
                                zlib.gunzip(Buffer.from(res._cache), function (err, decoded) {
                                    res.body=decoded
                                    res._complete=true
                                    cb(err,res)
                                })
                            }else if(res.headers['Content-Encoding']==='br'){
                                zlib.brotliDecompress(Buffer.from(res._cache), function (err, decoded) {
                                    res.body=decoded
                                    res._complete=true
                                    cb(err,res)
                                })
                            }else{
                                res.body=Buffer.from(res._cache)
                                res._complete=true
                                cb(null,res)
                            }
                            return
                        }else{
                            res._chunkHeader=false
                            res._chunkBody=true
                            res._chunkCache=[]
                        }
                    }
                }else if(res._chunkBody){
                    res._cache.push(data[i])
                    res._chunkIndex++
                    if(res._chunkIndex===res._chunkLength){
                        res._chunkBody=false
                        res._chunkTail=true
                        res._chunkIndex=0
                    }
                }else if(res._chunkTail){
                    res._chunkCache.push(data[i])
                    if(res._chunkCache.length===2){
                        if(res._chunkCache[0]===13&&res._chunkCache[1]===10){
                            res._chunkTail=false
                            res._chunkHeader=true
                            res._chunkCache=[]
                        }else{
                            res._err=new Error('bad chunk')
                            return
                        }
                    }
                }
            }else{
                cb(new Error('no Transfer-Encoding or Content-Length in respone header'))
            }
        }
    }
}

function socks5HandShake2(socket,urlInfo){
    let b=[]
    b.push(5) //写入版本号
    b.push(1) //NMETHODS
    b.push(0) //是否认证
    let ipv4=urlInfo.host.split('.')
    if(ipv4.length===4){
        b.push(1) //ipv4
        for(let i=0;i<4;i++){
            b.push(parseInt(ipv4[i]))
        }
    }else{
        if(urlInfo.host.length > 255) {
            cb(new Error('host too long > 255'))
            return
        }
        b.push(3) //url地址类型
        b.push(urlInfo.host.length)
        for(let i=0;i<urlInfo.host.length;i++){
            b.push(urlInfo.host[i].charCodeAt())
        }
    }
    b.push(urlInfo.port>>8)
    b.push(urlInfo.port&0xff)
    let buf=Buffer.from(b)
    socket.write(buf)
}

function socks5HandShake1(socket){
    let b=[]
    b.push(5)//写入版本号
    b.push(1)//写入cmd
    b.push(0)//是否认证
    socket.write(Buffer.from(b))
}

function tlsHandShake(option){
    let opt={rejectUnauthorized:false,socket:option.socket}
    if('servername' in option){
        opt.servername=option.servername
    }
    let tlsSocket=tls.connect(opt,function(){})
    return tlsSocket
}

function sendRequest(socket,option,urlInfo) {
    let s=`${option.method} ${urlInfo.path} HTTP/1.1\r\n`
    s+=`Host: ${urlInfo.host}\r\n`
    if('headers' in option){
        for(let k in option.headers){
            s+=`${k}:${option.headers[k]}\r\n`
        }
    }
    s+='\r\n'
    socket.write(s)
    if(option.method==='POST' && 'data' in option){
        socket.write(option.data)
    }
}

function sendTlsRequest(socket,option,urlInfo,cb){
    let response={
        headers:{},
        body:null,
        statusCode:0,
        _headerComplete:false,
        _complete:false,
        _cache:[],
        _chunkLength:0,
        _chunkIndex:0,
        _chunkCache:[],
        _chunkHeader:true,
        _chunkBody:false,
        _chunkTail:false,
    }
    let tlsSocket=tlsHandShake({socket:socket,servername:urlInfo.host})
    tlsSocket.on('secureConnect', () => {
        sendRequest(tlsSocket,option,urlInfo)
    })
    tlsSocket.on('data', (data) => {
        parseData(response,data,function(err,res){
            if(err){
                cb(err)
            }else if(response._complete){
                deleteResFields(res)
                cb(null,res)
            }
        })
    })
    tlsSocket.on('error', function(err){
        releaseSocket(tlsSocket)
        cb(err)
    })
    tlsSocket.on('close', () => {
        releaseSocket(tlsSocket)
    })
}

function sendHttpsProxyConnect(socket,option,urlInfo){
    let s=`CONNECT ${urlInfo.host}:${urlInfo.port} HTTP/1.1\r\n`
    s+=`Host: ${urlInfo.host}:${urlInfo.port}\r\n`
    if('header' in option){
        if('User-Agent' in option.headers){
            s+=`User-Agent: ${option.headers['User-Agent']}\r\n`
        }
    }
    s+='\r\n'
    socket.write(s)
}

function doTlsRequest(socket,option,urlInfo,destInfo,cb){
    let httpsProxyConnecting=false
    let connectResp=Buffer.alloc(0)
    let tlsSocket=tlsHandShake({socket:socket})
    let response={
        headers:{},
        body:null,
        statusCode:0,
        _headerComplete:false,
        _complete:false,
        _cache:[],
        _chunkLength:0,
        _chunkIndex:0,
        _chunkCache:[],
        _chunkHeader:true,
        _chunkBody:false,
        _chunkTail:false,
    }

    tlsSocket.on('secureConnect', () => {
        if('proxy' in option){
            if(urlInfo.protocol==='https:'){
                //这里不确定https代理是CONNECT还是直接写请求头
                httpsProxyConnecting=true
                sendHttpsProxyConnect(tlsSocket,option,urlInfo)
            }else{
                sendRequest(tlsSocket,option,urlInfo)
            }
        }
        else{
            sendRequest(tlsSocket,option,urlInfo)
        }
    })
    tlsSocket.on('data', (data) => {
        if(httpsProxyConnecting){
            connectResp=Buffer.concat([connectResp,data])
            let cr=checkConnectingFromData(connectResp)
            if(cr.statusCode===200 && cr.complete){
                httpsProxyConnecting=false
                sendTlsRequest(tlsSocket,option,urlInfo,cb)
            }else if(cr.statusCode&&cr.statusCode !==200){
                releaseSocket(tlsSocket)
                cb(new Error(`proxy CONNECT status code:${cr.statusCode}`))
            }
        }else{
            //处理数据
            parseData(response,data,function(err,res){
                if(err){
                    cb(err)
                }else if(response._complete){
                    deleteResFields(res)
                    cb(null,res)
                }
            })
        }
    })
    tlsSocket.on('error', function(err){
        releaseSocket(tlsSocket)
        cb(err)
    })
    tlsSocket.on('close', () => {
        releaseSocket(tlsSocket)
    })
}

function doRequest(socket,option,urlInfo,destInfo,cb){
    let httpsProxyConnecting=false
    let connectResp=Buffer.alloc(0)
    let socks5ProxyHandShaking1=false
    let socks5ProxyHandShaking2=false
    let socks5ProxyHandShaking1Result=Buffer.alloc(0)
    let socks5ProxyHandShaking2Result=Buffer.alloc(0)
    let response={
        headers:{},
        body:null,
        statusCode:0,
        _headerComplete:false,
        _complete:false,
        _cache:[],
        _chunkLength:0,
        _chunkIndex:0,
        _chunkCache:[],
        _chunkHeader:true,
        _chunkBody:false,
        _chunkTail:false,
    }
    socket.on('timeout',function(){
        cb(new Error('connection timeout'))
    })
    socket.on('error',function(err){
        cb(err)
    })
    socket.on('ready', () => {
        if(destInfo.protocol==='https:'){
            doTlsRequest(socket,option,urlInfo,destInfo,function(err,res){
                cb(err,res)
            })
        }else if(destInfo.protocol==='socks5:'){
            socks5ProxyHandShaking1=true
            socks5HandShake1(socket,urlInfo)
        }else{
            if('proxy' in option){
                if(urlInfo.protocol==='https:'){
                    httpsProxyConnecting=true
                    sendHttpsProxyConnect(socket,option,urlInfo)
                }else{
                    sendRequest(socket,option,urlInfo)
                }
            }
            else{
                sendRequest(socket,option,urlInfo)
            }
        }
    })
    socket.on('data', (data) => {
        if(httpsProxyConnecting){
            connectResp=Buffer.concat([connectResp,data])
            let cr=checkConnectingFromData(connectResp)
            if(cr.statusCode===200 && cr.complete){
                httpsProxyConnecting=false
                sendTlsRequest(socket,option,urlInfo,cb)
            }else if(cr.statusCode&&cr.statusCode !==200){
                cb(new Error(`proxy CONNECT status code:${cr.statusCode}`))
            }
        }else if(socks5ProxyHandShaking1){
            socks5ProxyHandShaking1Result=Buffer.concat([socks5ProxyHandShaking1Result,data])
            if(socks5ProxyHandShaking1Result.length<2){
                //继续等待数据
            }else if(socks5ProxyHandShaking1Result[0]!==5){
                socks5ProxyHandShaking1=false
                cb(new Error('unexpected socks version'))
            }else{
                socks5ProxyHandShaking1=false
                socks5ProxyHandShaking2=true
                socks5HandShake2(socket,urlInfo)
            }
        }else if(socks5ProxyHandShaking2){
            socks5ProxyHandShaking2Result=Buffer.concat([socks5ProxyHandShaking2Result,data])
            if(socks5ProxyHandShaking2Result.length < 3){
                //继续等待数据
            }else if(socks5ProxyHandShaking2Result[0]!==5){
                socks5ProxyHandShaking2=false
                cb(new Error('unknown socks error'))
            }else if(socks5ProxyHandShaking2Result[1]!==0){
                socks5ProxyHandShaking2=false
                cb(new Error('unknown socks error'))
            }else if(socks5ProxyHandShaking2Result[2]!==0){
                socks5ProxyHandShaking2=false
                cb(new Error('non-zero reserved field'))
            }else{
                socks5ProxyHandShaking2=false
                if(urlInfo.protocol==='https:'){
                    sendTlsRequest(socket,option,urlInfo,cb)
                }else{
                    sendRequest(socket,option,urlInfo)
                }
            }
        }else{
            parseData(response,data,function(err,res){
                if(err){
                    cb(err)
                }else if(response._complete){
                    deleteResFields(res)
                    cb(null,res)
                }
            })
        }
    })
    socket.on('close', () => {
        releaseSocket(socket)
    })
}




function _request(option,cb){
    let complete=false
    if(!('timeout' in option)){
        option.timeout=15000//默认15秒
    }
    if(!('redirect' in option)){
        option.redirect=true//默认开启重定向
    }
    let urlInfo=url.parse(option.url)
    if(urlInfo.host===null){
        cb(new Error(`malformat url: ${option.url}`))
        return
    }
    if(urlInfo.port===null){
        if(urlInfo.protocol==='http:'){
            urlInfo.port=80
        }else if(urlInfo.protocol==='https:'){
            urlInfo.port=443
        }else{
            cb(new Error(`malformat url: ${option.url}`))
            return
        }
    }
    urlInfo.host=urlInfo.host.split(':')[0]
    let proxyInfo=null
    if('proxy' in option){
        proxyInfo=url.parse(option.proxy)
        if(proxyInfo.host===null){
            cb(new Error(`malformat proxy url: ${option.proxy}`))
            return
        }
        if(proxyInfo.port===null){
            if(proxyInfo.protocol==='http:'){
                proxyInfo.port=80
            }else if(proxyInfo.protocol==='https:'){
                proxyInfo.port=443
            }else{
                cb(new Error(`malformat proxy url: ${option.proxy}`))
                return
            }
        }
        proxyInfo.host=proxyInfo.host.split(':')[0]
    }
    let destInfo=urlInfo
    if(proxyInfo){
        destInfo=proxyInfo
    }
    if(destInfo.protocol !== 'http:'&&destInfo.protocol !== 'https:'&&destInfo.protocol !== 'socks5:'){
        cb(new Error(`unknown protocol:${destInfo.protocol}`))
    }
    if(!option.method){
        option.method='GET'
    }
    let opt={port:destInfo.port,host:destInfo.host}
    if('timeout' in option){
        opt.timeout=option.timeout
    }
    try{
        var socket=net.connect(opt,function(){})   
    }catch (e) {
        cb(e)
        return
    }
    option.deadline=new Date().getTime()+option.timeout+500
    let deadline=setTimeout(function(){
        if(!socket.destroyed){
            socket.destroy()
        }
        cb(new Error('socket timeout'))},option.deadline-new Date().getTime())
    doRequest(socket,option,urlInfo,destInfo,function(err,res){
        if(complete){
            return
        }
        complete=true
        releaseSocket(socket)
        clearTimeout(deadline)
        if(option.redirect&&!err && res.statusCode>300 &&res.statusCode<309){
            if('Location' in res.headers){
                let newUrlInfo=url.parse(res.headers['Location'])
                if(newUrlInfo.host ===null){
                    option.url=`${urlInfo.protocol}//${urlInfo.host}${urlInfo.port===80||urlInfo.port===443?'':urlInfo.port}${res.headers['Location'].startsWith('/')?'':'/'}${res.headers['Location']}`
                }else{
                    option.url=res.headers['Location']
                }
                _request(option,cb)
            }else{
                if(err===null){
                    res.options=option
                }
                cb(err,res)
            }
        }else{
            if(err===null){
                res.options=option
            }
            cb(err,res)
        }
    })
}

/***********************************
 * 发起一个网络请求,完成或结束都会立即断开连接,如果带有callback参数,则为回调函数版本,没带callback参数,则为Promise版本
 *
 * @param {object} [option] Optional settings
 * @param {string} [option.url] url <https://www.baidu.com>
 * @param {string} [option.proxy] the proxy <http://12.34.56.78:2580><socks5://12.34.56.78:1080>
 * @param {string} [option.methd] 默认GET,支持GET和POST,POST不同类型数据需要在headers选项添加对应字段
 * @param {string|Buffer|Uint8Array} [option.data] POST的数据,如果方法为GET,该选项无效
 * @param {object} [option.headers] 浏览器请求头,默认不带请求头
 * @param {number} [option.timeout] 请求超时时间,单位毫秒,默认15秒
 * @param {boolean} [option.redirect] 是否重定向,例如302重定向,默认true
 * @param {function} [cb] callback,<function(err,res){}> 完成后的回调函数,res里通常有用的信息是res.headers{object},res.body{Buffer},res.statusCode{number},res.options{object}(就是你请求参数的option)
 *
 */

function request(option,cb){
    if(cb && typeof cb =='function'){
        _request(option,cb)
    }else{
        return new Promise(function (resolve, reject) {
            _request(option,function(err,res){
                if(err){
                    reject(err)
                }else{
                    resolve(res)
                }
            })
        })
    }
}

module.exports=request