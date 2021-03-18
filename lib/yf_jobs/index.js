const EventEmitter = require('events').EventEmitter
const util=require('util')

EventEmitter.prototype.onAsync=EventEmitter.prototype.on
function jobs(opt){
    this.pool=[]
    this.resolves=[]
    this.freeWatcher=[]
    this.count=0
    this.opt=opt
    if(!this.opt.limit){
        this.opt.limit=0
    }
    this.done=this._done.bind(this)
}

util.inherits(jobs,EventEmitter)

jobs.prototype.queue=function(data){
    let self=this
    self.pool.push(data)
    if(self.opt.limit===0||self.count<this.opt.limit){
        self.count++
        self._schedule()
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
    if((this.opt.limit===0||this.count<this.opt.limit)&&this.pool.length>0) {
        this.count++
        this._schedule()
    }else if(this.resolves.length>0){
        this.resolves.shift()()
    }else if(this.count===0 && this.pool.length===0){
        this.emit('drain')
        while(this.freeWatcher.length>0){
            this.freeWatcher.shift()()
        }
    }
}

jobs.prototype._schedule=async function(){
    let data=this.pool.shift()
    this.emit('schedule',data)
    await this.emitAsync('scheduleSync',data)
    if(this.opt.callback&&typeof this.opt.callback=='function'){
        await this.opt.callback(data,this.done)
    }else{
        this.done()
    }
}

jobs.prototype.emitAsync=function(event,...args){
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

module.exports=jobs