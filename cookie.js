const request=require('request')
const util=require('util')
function cookie(jar){
    if(jar){
        this.jar=jar
    }else{
        this.jar=request.jar()
    }
}

/*********************************
 * 添加cookie
 * @param cookieStr string cookie字符串,多个用分号隔开,可以从浏览器开发者工具直接复制
 * @param uri string
 * @param option object cookie选项,默认值为{},如果没设置domain,则从uri中提取,
 * 例如https://www.sina.com/index.html中提取 .sina.com
 * 如果没设置path,默认为'/'
 */
cookie.prototype.add=function(cookieStr,uri,option){
    let j = request.jar()
    let cookiesS=cookieStr.split(';')
    cookiesS.forEach(function(cookie){
        j.setCookie(cookie,uri)
    })
    let cookies=j.getCookies(uri)
    let self=this
    let p='/'
    if(!option){
        option={}
    }
    if(option.path){
        p=option.path
    }
    let d=''
    if(option.domain){
        d=option.domain
    }else{
        let begin=uri.indexOf('.')
        if(begin != -1){
            d=uri.substr(begin)
        }
        let end=d.indexOf('/')
        if(end != -1){
            d=d.substr(0,d.indexOf('/'))
        }
    }
    delete(option.domain)
    delete(option.path)
    cookies.forEach(function (cookie) {
        cookie.domain=d
        cookie.path=p
        for(let k in option){
            cookie.k=option[k]
        }
        self.jar.setCookie(cookie,uri)
    })
}

/**********************************
 * 直接添加到内部jar
 * @param cookieStr string cookie字符串,多个用分号隔开,可以从浏览器开发者工具直接复制
 * @param uri string
 */

cookie.prototype.addToJar=function(cookieStr,uri){
    let self=this
    let cookiesS=cookieStr.split(';')
    cookiesS.forEach(function(cookie){
        self.jar.setCookie(cookie,uri)
    })
}

cookie.prototype.getJar=function(){
    return this.jar
}

/**************************
 * 该函数把内部jar转换为puppeteer可用的cookie
 */

cookie.prototype.getPupCookies=async function(){
    const store = this.jar._jar.store
    var cookies=(await Promise.all(Object.keys(store.idx).map(d => util.promisify(store.findCookies).call(store, d, null)))).flat()
    return cookies.map(c => ({ ...c, expires: c.expires instanceof Date ? c.expires.getTime() / 1000 : -1, name: c.key }))
}

module.exports=cookie