const EventEmitter = require('events').EventEmitter
const util=require('util')
function jobs(opt){
    this.pool=[]
    this.resolves=[]
    this.freeWatcher=[]
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

jobs.prototype.isFree=function(){
    return this.pool.length===0 && this.count===0
}

jobs.prototype.watchFree=function(){
    if(this.pool.length===0 && this.count===0){
        return new Promise(function (resolve) {
            resolve()
        })
    }else{
        return new Promise((resolve)=> {
            this.freeWatcher.push(resolve)
        })
    }
}

jobs.prototype._done=function(){
    this.count--
    if(this.count===0 && this.pool.length===0){
        this.emit('drain')
        while(this.freeWatcher.length>0){
            this.freeWatcher.shift()()
        }
    }else{
        this._schedule()
    }
}

jobs.prototype._schedule=async function(){
    if(this.pool.length>0 && ((this.opt.limit>0 && this.count<this.opt.limit)||!this.opt.limit)){
        this.count++
        let data=this.pool.shift()
        if(this.resolves.length>0){
            this.resolves.shift()()
        }
        this.emit('schedule',data)
        await this.emitAsync('scheduleSync',data)
        if(this.opt.callback&&typeof this.opt.callback=='function'){
            this.opt.callback(data,this.done)
        }else{
            this.done()
        }
    }
}

module.exports=jobs