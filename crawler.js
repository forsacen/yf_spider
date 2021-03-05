const Jobs=require('./lib/yf_jobs')
const request=require('./lib/yf_request')
const cheerio=require('cheerio')
const iconv = require('iconv-lite')
const EventEmitter = require('events').EventEmitter
const util=require('util')
function crawler(opt){
    this.option=opt
    this.limit=0
    this.maxSize=0
    if('maxConnections' in this.option){
        this.limit=this.option.maxConnections
    }
    if('maxSize' in this.option){
        this.maxSize=this.option.maxSize
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
    this.jobs=new Jobs({limit:this.limit,maxSize:this.maxSize,callback:(option,done)=>{
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
            request(reqOpt,async (err,res)=> {
                if(err&&reqOpt.retries>0){
                    reqOpt.retries--
                    await this.jobs.queue(reqOpt)
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
                if(reqOpt.callback && typeof reqOpt.callback==='function'){
                    await reqOpt.callback(err,res)
                }
                done()
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
crawler.prototype.queue=function(option){
    return this.jobs.queue(option)
}

crawler.prototype.safeQueue=function(option){
    return this.jobs.safeQueue(option)
}

crawler.prototype.watchFree=function(){
    return this.jobs.watchFree()
}

crawler.prototype.isFree=function(){
    return this.jobs.isFree()
}

crawler.prototype.watchFree=function(){
    return this.jobs.watchFree()
}



module.exports=crawler