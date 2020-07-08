function spider(option){
    if('crawler' in option){
        const Crawler=require('./crawler')
        this.crawler=new Crawler(option.crawler)
    }
    if('puppeteer' in option){
        const Puppeteer = require('./puppeteer')
        this.puppeteer=new Puppeteer()
        this.puppeteer.init(option.puppeteer)
    }
}

module.exports=spider