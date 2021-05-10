const puppeteer=require('puppeteer')
const args=[
    //'--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-zygote',
    '--disable-infobars',
]
const ignoreDefaultArgs=["--enable-automation"]
function _request(option,cb){
    if(option.puppeteer===undefined){
        option.puppeteer={}
    }
    if(option.puppeteer.ignoreDefaultArgs){
        Array.prototype.push.apply(option.puppeteer.ignoreDefaultArgs,ignoreDefaultArgs)
        option.puppeteer.ignoreDefaultArgs=Array.from(new Set(option.puppeteer.ignoreDefaultArgs))
    }else{
        option.puppeteer.ignoreDefaultArgs=ignoreDefaultArgs
    }
    if(option.puppeteer.args){
        Array.prototype.push.apply(option.puppeteer.args,args)
        option.puppeteer.args=Array.from(new Set(option.puppeteer.args))
    }else{
        option.puppeteer.args=args
    }
    if(option.proxy){
        option.puppeteer.args.push('--proxy-server='+option.proxy)
    }
    if(option.timeout===undefined){
        option.timeout=15000
    }
    if(option.charset===undefined){
        option.charset='utf-8'
    }
    if(option.waitUntil===undefined){
        option.waitUntil='domcontentloaded'
    }
    if(option.loadStatic===undefined){
        option.loadStatic=false
    }
    (async ()=>{
        try{
            var browser=await puppeteer.launch(option.puppeteer)
            var page=await browser.newPage()
            await page.setRequestInterception(true)
            if(!option.loadStatic){
                page.on('request',function(interceptedRequest,option){
                    if (interceptedRequest.url().endsWith('.png') ||
                        interceptedRequest.url().endsWith('.jpg')||
                        interceptedRequest.url().endsWith('.jpeg')||
                        interceptedRequest.url().endsWith('.ico')||
                        interceptedRequest.url().endsWith('.mp4')||
                        interceptedRequest.url().endsWith('.css')||
                        interceptedRequest.url().endsWith('.gif'))
                        interceptedRequest.abort()
                    else
                        interceptedRequest.continue()
                })
            }
            if(option.headers){
                await page.setExtraHTTPHeaders(option.headers)
            }
            await page.setDefaultNavigationTimeout(option.timeout)
            await page.goto(option.url,{waitUntil:option.waitUntil,timeout:option.timeout})
            if(option.waitForSelector){
                await page.waitForSelector(option.waitForSelector)
            }
            if(option.waitForTimeout){
                await page.waitForTimeout(option.waitForTimeout)
            }
            let content=await page.content()
            if(page && !page.isClosed()){
                await page.close()
            }
            if(browser){
                await browser.close()
            }
            if(cb && typeof cb=='function'){
                let res={}
                res.body=Buffer.from(content)
                res.options=option
                cb(null,res)
            }
        }catch (e) {
            if(page && !page.isClosed()){
                await page.close()
            }
            if(browser){
                await browser.close()
            }
            if(cb && typeof cb =='function'){
                let res={}
                res.options=option
                cb(e,res)
            }
        }
    })()
}


function request(option,cb){
    if(cb && typeof cb =='function'){
        _request(option,cb)
    }else{
        return new Promise(function (resolve) {
            _request(option,function(err,res){
                if(err){
                    resolve(err)
                }else{
                    resolve(res)
                }
            })
        })
    }
}

module.exports=request
