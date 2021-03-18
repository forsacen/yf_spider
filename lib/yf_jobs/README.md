# jobs
nodejs 开发的工作流水线框架

const Jobs=require('./jobs')

jobs:constructor

    jobs=new Jobs(option)
        option:object 
        opiton.limit:number 最多同时做多少个工作,0为不限,默认不限
        option.callback:function(option,done) 工作对应的函数,option就是queue放进去的数据,done是传过来的内置函数,工作完成后必须调用done函数
                        
jobs:method

    jobs.queue(option) reuturn promise,如果工作线程数量为limit,该方法会await阻塞,
        直到至少有一个工作线程空闲为止
        option:object 添加的数据

    jobs.queueSize() reuturn number
        工作队列长度,就是还未从队列中取出的工作的数量,read-only
        
    jobs.jobSize() return number
        正在执行的工作的数量,read-only
    
    jobs.isFree() return bool
            jobs是否处于空闲状态,(工作队列长度为0,正在执行的工作数量为0)
    
    jobs.watchFree() return promise,监控jobs是否处于空闲状态(工作队列长度为0,正在执行
        的工作数量为0),空闲时await该方法将返回(await jobs.watchFree())
        
jobs:event

    Event: 'schedule',任务开始之前触发,参数option,此时可以修改option做参数调整(option为
    object 时候才会生效)
    
    jobs.on('schedule',function(option){
        option.proxy='socks5://127.0.0.1:1080'
    })
    
    Event: 'scheduleSync',任务开始之前触发,参数option,此时可以修改option做参数调整(option为
        object 时候才会生效),
        和schedule不同之处在于该事件的处理函数如果是async function,将会被等待(await),
        使用方式为:
        jobs.onAsync('scheduleSync',async function(done,option){
            await //do something
            done()//该函数调用后 await该函数将返回
        }
        
    jobs.on('schedule',function(option){
            option.proxy='socks5://127.0.0.1:1080'
    })
    
    Event: 'drain',所有任务完成的时候触发
    jobs.on('drain',function(){
        console.log('all jobs done')
    }); 
