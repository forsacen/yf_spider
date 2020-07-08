const request=require('../yf_request')
const iconv = require('iconv-lite')
const headers={
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86.3538.102 Safari/537.36',
    'Connection':'keep-alive',
    'CacheControl':'no-cache',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Encoding':'gzip, deflate, br',
}
;(async function(){
    try{
        let res=await request({
            url:'https://www.baidu.com/s?wd=ip',
            timeout:5000,
            headers:headers,
            //proxy:'socks5://127.0.0.1:1080'
        })
        console.log(res.body.toString())
    }catch (e) {
        console.log(e)
    }
    request({url:'https://www.baidu.com',headers:headers},function (err,res) {
        if(err){
            throw err
        }
        console.log(res.body.toString())
    })
    request({url:'https://www.qq.com',headers:headers},function (err,res) {
        if(err){
            throw err
        }
        console.log(iconv.decode(res.body,'gb2312'))
    })
    request({url:'http://www.cz88.net/',headers:headers},function (err,res) {
        if(err){
            throw err
        }
        console.log(res.body.toString())
    })
    request({url:'http://pv.sohu.com/cityjson?ie=utf-8',headers:headers},function (err,res) {
        if(err){
            throw err
        }
        console.log(res.body.toString())
    })
    console.log('finish')
})()