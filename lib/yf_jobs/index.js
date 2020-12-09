const EventEmitter = require('events').EventEmitter
const util=require('util')
function jobs(opt){
    this.pool=[]
    this.resolves=[]
    this.count=0
    this.opt=opt
    if(!this.opt.limit){
        this.opt.limit=0
    }
    if(!this.opt.maxSize){
        this.opt.maxSize=0
    }
    this.done=this._done.bind(this)
}

util.inherits(jobs,EventEmitter)

jobs.prototype.queue=function(data){
    let self=this
    self.pool.push(data)
    self._schedule()
    if(self.opt.maxSize===0||self.pool.length<=self.opt.maxSize){
        return new Promise(function (resolve) {
            resolve()
        })
    }else{
        return new Promise((function (resolve) {
            self.resolves.push(resolve)
        }))
    }
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
        if(this.opt.maxSize>0&&this.resolves.length>0){
            this.resolves.shift()()
        }
        this.emit('schedule',data)
        if(this.opt.callback&&typeof this.opt.callback=='function'){
            this.opt.callback(data,this.done)
        }else{
            this.done()
        }
    }
}

module.exports=jobs