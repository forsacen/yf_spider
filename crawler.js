const Jobs=require('./lib/yf_jobs')
const request=require('./lib/yf_request')
const cheerio=require('cheerio')
const iconv = require('iconv-lite')
const EventEmitter = require('events').EventEmitter
const util=require('util')
function crawler(opt){
    this.option=opt
    this.limit=0
    if('maxConnections' in this.option){
        this.limit=this.option.maxConnections
    }
    if(!('retries' in this.option)){
        this.option.retries=3
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
    this.jobs=new Jobs({limit:this.limit,callback:(option,done)=>{
            let reqOpt=option
            if(!('retries' in reqOpt)){
                reqOpt.retries=this.option.retries
            }
            if(!('jquery' in reqOpt)){
                reqOpt.jquery=this.option.jquery
            }
            if(!('charset' in reqOpt)){
                reqOpt.charset=this.option.charset
            }
            if(!('callback' in reqOpt)){
                reqOpt.callback=this.option.callback
            }
            request(reqOpt,(err,res)=> {
                if(err&&reqOpt.retries>0){
                    reqOpt.retries--
                    delete reqOpt.deadline
                    this.jobs.queue(reqOpt)
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
                    reqOpt.callback(err,res)
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
}
util.inherits(crawler,EventEmitter)
crawler.prototype.queue=function(option){
    this.jobs.queue(option)
}

module.exports=crawler