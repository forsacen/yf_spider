const EventEmitter = require('events').EventEmitter
const util=require('util')
function jobs(opt){
    this.pool=[]
    this.count=0
    this.opt=opt
    this.done=this._done.bind(this)
}

util.inherits(jobs,EventEmitter)

jobs.prototype.queue=function(data){
    this.pool.push(data)
    this._schedule()
}

jobs.prototype.queueSize=function(){
    return this.pool.length
}

jobs.prototype.jobSize=function(){
    return this.count
}

jobs.prototype._done=function(){
    this.count--
    if(this.count===0 && this.pool.length===0){
        this.emit('drain')
    }else{
        this._schedule()
    }
}

jobs.prototype._schedule=async function(){
    if(this.pool.length>0 && ((this.opt.limit>0 && this.count<this.opt.limit)||!this.opt.limit)){
        this.count++
        let data=this.pool.shift()
        this.emit('schedule',data)
        if(this.opt.callback&&typeof this.opt.callback=='function'){
            this.opt.callback(data,this.done)
        }else{
            this.done()
        }
    }
}

module.exports=jobs