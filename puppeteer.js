const _=require('lodash')
const util=require('util')
const EventEmitter = require('events').EventEmitter
const Cookie=require('./cookie')
const cheerio=require('cheerio')

function puppeteer(){
    this.pup=require('puppeteer')
    this.taskQueue=[]
    this.taskCount=0
    this.browserOpt={
        headless: false,
        args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-zygote',
            '--disable-infobars',
        ],
        ignoreDefaultArgs: ["--enable-automation"]
    },
    this.defaultOpt={
        timeout:30000,
        maxConnections:10,
        waitUntil:'domcontentloaded',
        retries:3,
    }
    EventEmitter.call(this)
}

util.inherits(puppeteer,EventEmitter)

puppeteer.prototype.init=function(opt){
    let self=this
    let browserArgs=[]
    let browserIngnoreArgs=[]
    if (opt.base === undefined){
        opt.base={}
    }
    if (opt.extra===undefined){
        opt.extra={}
    }
    if('args' in opt.base){
        browserArgs=opt.base.args
    }
    if('ignoreDefaultArgs' in opt.base){
        browserIngnoreArgs=opt.base.ignoreDefaultArgs
    }
    Array.prototype.push.apply(this.browserOpt.args, browserArgs)
    Array.prototype.push.apply(this.browserOpt.ignoreDefaultArgs, browserIngnoreArgs)
    browserArgs=Array.from(new Set(this.browserOpt.args))
    browserIngnoreArgs=Array.from(new Set(this.browserOpt.ignoreDefaultArgs))
    _.extend(this.defaultOpt,opt.extra)
    _.extend(this.browserOpt,opt.base)
    if(this.defaultOpt.rateLimit){
        this.defaultOpt.maxConnections=1
    }
    this.browserOpt.args=browserArgs
    this.browserOpt.ignoreDefaultArgs=browserIngnoreArgs
    this.on('_schedule',function(){
        setTimeout(function(){
            self.schedule()
            if(!self.taskCount && !self.taskQueue.length){
                self.emit('_drain')
            }
        },typeof this.defaultOpt.rateLimit=='number'?this.defaultOpt.rateLimit:0)
    })
    this.on('_release',function(){
        this.taskCount--
        this.emit('_schedule')
    })
    this.on('_drain',function(){
        this.emit('drain')
    })
    this.on('_request',function(interceptedRequest,opt){
        this.emit('request',interceptedRequest,opt)
    })
}

puppeteer.prototype.queue=function(opt){
    this.taskQueue.push(opt)
    this.emit('_schedule')
}

puppeteer.prototype.schedule=function(){
    let maxRestConnections=this.defaultOpt.maxConnections?this.defaultOpt.maxConnections-this.taskCount:this.taskQueue.length
    let unFinishedTask=maxRestConnections<this.taskQueue.length?maxRestConnections:this.taskQueue.length
    for(let i=0;i<unFinishedTask;i++){
        let opt=_.defaults(this.taskQueue.shift(),this.defaultOpt)
        this.taskCount++
        this.emit('schedule',opt)
        this._run(opt)
    }
}

puppeteer.prototype._run=async function(opt){
    try{
        let browserOpt=_.cloneDeep(this.browserOpt)
        if(opt.proxy){
            browserOpt.args.push('--proxy-server='+opt.proxy)
        }
        var browser=await this.pup.launch(browserOpt)
        var page=await browser.newPage()
        if(opt.device){
            await page.emulate(opt.device)
        }
        if(opt.headers){
            await page.setExtraHTTPHeaders(opt.headers)
        }
        if(opt.userAgent){
            await page.setExtraHTTPHeaders({'User-Agent':opt.userAgent})
        }
        if(opt.referer){
            await page.setExtraHTTPHeaders({'Referer':opt.referer})
        }
        if(opt.jar){
            let c=new Cookie(opt.jar)
            let cookies= await c.getPupCookies()
            await page.setCookie.apply(page, cookies)
        }
        if(this._events.request){
            await page.setRequestInterception(true)
            page.on('request', interceptedRequest => {
                this.emit('_request',interceptedRequest,opt)
            })
        }
        await page.goto(opt.url,{waitUntil:opt.waitUntil,timeout: opt.timeout})
        if(typeof opt.waitFor=='number'){
            await page.waitFor(opt.waitFor)
        }else if(typeof opt.waitFor=='string'||typeof opt.waitFor=='function'){
            if(opt.waitForOption){
                await page.waitFor(opt.waitFor)
            }else{
                await page.waitFor(opt.waitFor,opt.waitForOption)
            }
        }else if(typeof opt.waitFor != 'undefined'){
            throw new Error('options.waitfor only support number,string,function')
        }
        if(opt.jar){
            cookies=await page.cookies()
            let c=new Cookie()
            cookies.forEach(json => {
                const { name,value,domain,path } = json
                json.key = name
                json.expires = json.expires > 0 ? new Date(json.expires * 1000) : 'Infinity'
                let cookieStr=name+'='+value
                delete(json.name)
                delete(json.value)
                c.add(cookieStr,'https://' + domain,json)
            })
            opt.jar=c.getJar()
        }
        if(opt.callback && typeof opt.callback=='function'){
            let content=await page.content()
            let $=cheerio.load(content,{decodeEntities: false})
            page.$=$
            page.options=opt
            await opt.callback(null,page)
        }
    }catch (e) {
        if(opt.retries>0){
            opt.retries--
            this.taskQueue.push(opt)
        }else if(opt.callback && typeof opt.callback=='function'){
            await opt.callback(e,opt)
        }
    }finally {
        if(page && !page.isClosed()){
            await page.close()
        }
        if(browser){
            await browser.close()
        }
        this.emit('_release')
    }
}


module.exports=puppeteer