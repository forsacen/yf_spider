# yf_spider
node爬虫，用js编写，用自己写的crawler和puppeteer封装，支持常规和puppeteer两种方式,因为node-crawler包使用request模块,由于有连接复用,缓存,
存在大规模并发请求下连接和内存暴增长时间释放的问题,所以自己写了个crawler代替

const spider=require('./yf_spider')

var s=new spider(option)

    option:object 初始化选项
    /***************************
    crawler
    ***************************/
    opiton.crawler:object 常规爬虫选项,不定义则不初始化常规爬虫,该项为全局设置,如果queue里有相关设置,则被覆盖
    option.crawler.maxConnections:number 最大并发多少,不设置或者0为不限
    option.crawler.type:string 下载器类型，默认request,可选puppeteer
    option.crawler.waitForSelector:string 页面等待选择器，默认无,type=puppeteer时有效
    option.crawler.waitForTimeout:number 毫秒，页面完成后再等多久，默认无，type=puppeteer时有效
    option.crawler.headless:bool 默认true,是否启用无头浏览器，type=puppeteer时有效
    option.crawler.loadStatic:bool 默认false,是否加载静态资源，有jpg,png,ico,gif,css,mp4,jpeg
    option.crawler.retries:number 默认为3,失败了重试几次
    option.crawler.timeout:超时选项,毫秒,默认30秒,30000毫秒
    option.crawler.jquery:bool 默认true,内容是否用jquery解析,解析后存在res.$里面
    option.crawler.charset:string 默认utf-8,还支持gb2312,gbk,该选项和jquery选项有关,如果jquery选项为false,该选项无效
    option.crawler.redirect:bool 默认true,是否重定向,比如301,302跳转,
    option.crawler.errPageCommiter:object 默认undefined,如果不为undefind,则必须包含错误页面提交器,如果有该选项,获取页面失败后会
        调用提交器的submit方法自动上传相关数据,以便以后修复,
        修复的请求的res.options会带有_repairID选项
    option.crawler.successPageSubmiter:object 默认undefined,如果不为undefind,则必须包含成功页面提交器,获取页面成功后会自动
        调用提交器的submit方法上传相关数据,下次数据库中找到该条数据则不会重爬。

    
    /***************************
    puppeteer
    ***************************/        
    option.puppeteer:object
    option.puppeteer.base:完全等于官方puppeteer选项
    option.puppeteer.extra:额外增加选项
    option.puppeteer.extra.timeout:超时选项,毫秒,默认30,0不限
    option.puppeteer.extra.rateLimit: 延迟加载,单位毫秒,maxConnections将被强制设置为1
    option.puppeteer.extra.maxConnections:爬虫并发数,默认10,0不限
    option.puppeteer.extra.waitUntil:页面加载等待选项,默认为domcontentloaded,和官方puppeteer一致
    option.puppeteer.extra.callback:可以为async函数,加载完成后调用,如果要进一步操作page,必须是async函数
         error:Error
         page:puppeteer的page
                        
spider.crawler:method

    crawler.queue(option):添加任务
        option:object
        option.type:string 下载器类型，默认request,可选puppeteer
        option.waitForSelector:string 等待的元素，默认无,option.type为puppeteer时有效
        option.waitForTimeout:number 毫秒,页面加载完成后再等多长时间，默认无，option.type为puppeteer时有效
        option.waitUntil:string默认domcontentloaded，可选networkidle0，networkidle2，option.type为puppeteer时有效
        option.headless:bool默认false,是否启用无头模式，option.type为puppeteer时有效
        option.loadStatic:bool是否加载静态资源，包括css,jpg,png,ico,gif,mp4,默认false，option.type为puppeteer时有效
        option.url:string 采集的url
        option.proxy:string 代理,格式http://123.231.110.119:8888, socks5://127.0.0.1:1080
        option.methd:string 默认GET,支持GET和POST,POST不同类型数据需要在headers选项添加对应字段
        option.data:string|Buffer|Uint8Array POST的数据,如果方法为GET,该选项无效
        option.timeout:number 超时选项,毫秒,默认0秒为不限 
        option.headers:object对象,浏览器httpheader,默认没有
        option.retries:number 默认为3,失败了重试几次
        option.jquery:bool 默认true,内容是否用jquery解析,解析后存在res.$里面
        option.charset:string 默认utf-8,还支持gb2312,gbk,该选项和jquery选项有关,如果jquery选项为false,该选项无效
        option.redirect:bool 默认false,是否重定向,比如301,302跳转,option.type不为puppeteer时有效
        option.callback:function 回调函数
        
    crawler.isFree():return bool
        爬虫是否处于空闲状态
                  
    crawler.watchFree() return promise,监控爬虫是否处于空闲状态,
        空闲时await该方法将返回(await crawler.watchFree())

spider.puppeteer:method     
 
    puppeteer.queue(option):添加任务        
        option:每次请求选项
        option.url:要加载的url
        option.timeout:页面超时选项,毫秒,默认0秒为不限
        option.waitUntil:页面加载等待选项,默认为domcontentloaded,和官方puppeteer一致
        option.waitFor:页面打开后等待选项,整数为等待毫秒数,字符串为等待selector标签出现为止,还有function
        option.waitForOption:waitfor选项,和官方的waitFor参数一致
        option.callback:可以为async函数,加载完成后调用,如果要进一步操作page,必须是async函数
            error:Error
            page:puppeteer的page,callback返回后会自动关闭
        option.headers:object对象,覆盖对应的浏览器默认header项                                           
        option.userAgent:string,自定义userAgent
        option.jar:request.jar,自定义cookiejar
        option.device:'puppeteer/DeviceDescriptors',指定用什么设备模拟
        option.proxy:string,代理(http,https,socks5),例如socks5://127.0.0.1:1080


spider.crawler:event

    Event: 'schedule',任务即将开始前触发,用于修改请求参数
    Event: 'drain',任务队列为空触发
    Event: 'scheduleSync',任务开始之前触发,参数option,此时可以修改option做参数调整(option为
            object 时候才会生效),
            和schedule不同之处在于该事件的处理函数如果是async function,将会被等待(await),
            使用方式为:
            this.onAsync('scheduleSync',async function(done,option){
                await //do something
                done()//该函数调用后 await该函数将返回
            }

spider.puppeteer:event
    
    Event: 'schedule',任务即将开始前触发
    arg: 
        options
    exampe:
    spider.puppeteer.on('schedule',function(options){
        
    });
    
    Event: 'request',请求前触发
    arg:
        interceptedRequest 被拦截的request,和官方的一样
        options queue方法参数的option选项
    example:
    spider.puppeteer.on('request',function(interceptedRequest,option){
            if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg')|| interceptedRequest.url().endsWith('.ico'))
                interceptedRequest.abort()
            else
                interceptedRequest.continue()
        })
        
    Event: 'drain',任务空了的时候处理
    spider.puppeteer.on('drain',function(){
        db.end();// close connection to MySQL
    }); 
