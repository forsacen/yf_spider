const request=require('./index')
request({url:'https://www.baidu.com/s?wd=ip',waitForSelector:'.card_yAljk'},function (err,res){
    console.log(res)
})