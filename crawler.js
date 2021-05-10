const Jobs=require('./lib/yf_jobs')
const cheerio=require('cheerio')
const iconv = require('iconv-lite')
const EventEmitter = require('events').EventEmitter
const util=require('util')
function crawler(opt){
    this.option=opt
    this.limit=0
    if(this.option.type==='puppeteer'){
        this.request=require('./lib/yf_puppeteer')
    }else{
        this.request=require('./lib/yf_request')
    }
    if('maxConnections' in this.option){
        this.limit=this.option.maxConnections
    }
    if(!('retries' in this.option)){
        this.option.retries=3
    }
    if(!('timeout' in this.option)){
        this.option.timeout=30000
    }
    if(!('charset' in this.option)){
        this.option.charset='utf-8'
    }
    if(!('jquery' in this.option)){
        this.option.jquery=true
    }
    if(!('redirect' in this.option)){
        this.option.redirect=true
    }
    if(this.option.type==='puppeteer'&&!('puppeteer' in this.option)){
        this.option.puppeteer= {}
    }
    this.jobs=new Jobs({limit:this.limit,callback:(option,done)=>{
            let reqOpt=option
            if(!('retries' in reqOpt)){
                reqOpt.retries=this.option.retries
            }
            if(!('jquery' in reqOpt)){
                reqOpt.jquery=this.option.jquery
            }
            if(!('timeout' in reqOpt)){
                reqOpt.timeout=this.option.timeout
            }
            if(!('redirect' in reqOpt)){
                reqOpt.redirect=this.option.redirect
            }
            if(!('charset' in reqOpt)){
                reqOpt.charset=this.option.charset
            }
            if(!('callback' in reqOpt)){
                reqOpt.callback=this.option.callback
            }
            if(this.option.type==='puppeteer'){
                if(!('puppeteer' in reqOpt)){
                    reqOpt.puppeteer=this.option.puppeteer
                }
                if(reqOpt.waitForTimeout===undefined&&this.option.waitForTimeout!==undefined){
                    reqOpt.waitForTimeout=this.option.waitForTimeout
                }
                if(reqOpt.waitUntil===undefined&&this.option.waitUntil!==undefined){
                    reqOpt.waitUntil=this.option.waitUntil
                }
                if(reqOpt.loadStatic===undefined&&this.option.loadStatic!==undefined){
                    reqOpt.loadStatic=this.option.loadStatic
                }
                if(reqOpt.waitForSelector===undefined&&this.option.waitForSelector!==undefined){
                    reqOpt.waitForSelector=this.option.waitForSelector
                }
                if(reqOpt.headless===undefined&&reqOpt.puppeteer.headless===undefined&&this.option.headless!==undefined){
                    reqOpt.puppeteer.headless=this.option.headless
                }else if(reqOpt.headless!==undefined){
                    reqOpt.puppeteer.headless=reqOpt.headless
                    delete reqOpt.headless
                }else{
                    reqOpt.puppeteer.headless=true
                }
            }
            this.request(reqOpt,async (err,res)=> {
                if(err&&reqOpt.retries>0){
                    reqOpt.retries--
                    this.jobs.pool.unshift(reqOpt)
                    done()
                    return
                }
                if(!err&&reqOpt.jquery){
                    if(reqOpt.charset==='utf-8'){
                        res.$=cheerio.load(res.body.toString(),{decodeEntities: false})
                    }else{
                        res.$=cheerio.load(iconv.decode(res.body,reqOpt.charset),{decodeEntities: false})
                    }
                }
                if(err && this.option.errPageSubmiter){
                    let data=Object.assign({},res.options)
                    await this.option.errPageSubmiter.submit(data)
                }else if(err===null){
                    if(res.options._repairID){
                        await this.option.errPageSubmiter.delete(res.options._repairID)
                        delete res.options._repairID
                    }
                    if(this.option.successPageSubmiter){
                        await this.option.successPageSubmiter.submit(res.options.url)
                    }
                }
                if(reqOpt.callback && typeof reqOpt.callback==='function'){
                    await reqOpt.callback(err,res)
                }
                await done()
            })
        }})
    this.jobs.on('drain',()=>{
        this.emit('drain')
    })
    this.jobs.on('schedule',(option)=>{
        this.emit('schedule',option)
    })
    this.jobs.onAsync('scheduleSync',async (done,option)=>{
        await this.emitAsync('scheduleSync',option)
        done()
    })
}
util.inherits(crawler,EventEmitter)

crawler.prototype.emitAsync=function(event,...args){
    return new Promise((resolve)=>{
        if(this._events&&this._events[event]){
            if(typeof this._events[event]==='function'){
                this.emit(event,resolve,...args)
            }else{
                let count=this._events[event].length
                this.emit(event,()=>{
                    count--
                    if(count===0){
                        resolve()
                    }
                },...args)
            }
        }else{
            resolve()
        }
    })
}

crawler.prototype.queue=async function(option){
    if(this.option.successPageSubmiter){
        let re= await this.option.successPageSubmiter.spied(option.url)
        if(re){
            return
        }
    }
    return this.jobs.queue(option)
}

crawler.prototype.watchFree=function(){
    return this.jobs.watchFree()
}

crawler.prototype.isFree=function(){
    return this.jobs.isFree()
}

module.exports=crawler