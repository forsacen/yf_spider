const https=require('https')
const url=require('url')
const Jobs=require('../jobs')
let jobs=new Jobs({limit:2,callback:(option,done)=>{
        var options = url.parse(option.url)
        const req = https.request(options, (res) => {
            console.log(`状态码: ${res.statusCode}`)
            let body=''
            res.on('data', (chunk) => {
                body+=chunk
            })
            res.on('end', () => {
                //console.log(body)
                console.log(option.url)
                done()
            })
        })
        req.on('error', (e) => {
            console.error(`请求遇到问题: ${e.message}`)
            done()
        })
        req.end();
    }})
jobs.on('drain',()=>{
    console.log('drain')
})
jobs.queue({url:'https://www.sina.com'})
jobs.queue({url:'https://www.baidu.com'})
jobs.queue({url:'https://www.qq.com'})
jobs.queue({url:'https://www.163.com'})