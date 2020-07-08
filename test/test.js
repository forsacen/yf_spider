const Spider=require('../../yf_spider')
const Cookie=require('../cookie')
const headers={
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86.3538.102 Safari/537.36',
    'Connection':'keep-alive',
    'CacheControl':'no-cache',
    'Cookie':'BIDUPSID=C72A4D41C2B6707CB82AA04E298A690F; PSTM=1566923817; BDUSS=ViLU8wUi1vZVNDc0Y2THdHb3hCRTBjYmRLMTgxUGl4SmdKVTN3c1Q2cFdUdzVlRVFBQUFBJCQAAAAAAAAAAAEAAAA4vbUdQW5nbGVfU2VhbgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFbC5l1WwuZdTH; BAIDUID=CDE2B1BBBF28C29C9955503B6F6F3579:FG=1; H_WISE_SIDS=142529_146743_142018_145945_145497_147027_147280_146536_146308_145931_131246_144681_141261_144741_144251_146574_146869_127969_147350_147321_146750_145418_146732_145875_146205_131423_146801_128699_142209_146002_145601_128149_107317_145288_146594_146136_139910_147295_146824_146396_144966_147301_145608_146305_141910_145396_143857_146791_139913_110085; BD_UPN=123353; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; delPer=0; BD_CK_SAM=1; shifen[6848923_20970]=1594146472; BD_HOME=1; PSINO=6; ZD_ENTRY=baidu; shifen[164502915102_90964]=1594158154; shifen[158193834993_84627]=1594158187; BCLID=9642913741736442289; BDSFRCVID=eNKOJeC629_m27or3yowUlangtfN8Q6TH6aoN5c7j1R0Ov8DwwEDEG0Pof8g0KubZujCogKKKmOTH18F_2uxOjjg8UtVJeC6EG0Ptf8g0f5; H_BDCLCKID_SF=tRk8oI0aJDvjDb7GbKTMbtCSbfTJetJyaR3D0hOvWJ5WqR7jDpnmW-CXDP5h-lQQKCoM0lvcbfL5ShbXXMoMQnFLWhbitttO3HcwhD5S3l02V-bv-fJf5qRDhpAO04RMW20j0h7mWIQvsxA45J7cM4IseboJLfT-0bc4KKJxbnLWeIJEjjC5D5JLjH8et6nE2I5L3Rn2bPt_D-TR2-5Bq4tHepb8BxRZ5mAqoJRI-l6aM4_R2tnB3tA_hxJdWl3GQ2QnaIQqabDVVb3P2-QjDMbDLxRPa-b43bRTWMKy5KJvfJoqDJbMhP-UyPRLWh37tRblMKoaMp78jR093JO4y4Ldj4oxJpOJ5JbMonLafD_BMCD9jjKben-W5gThK4cE2TT0QTrJabC3eqroXU6qLT5XeJnLJjby-J78W-3Ganj_ePbIX67Gjl0njxQyWjQ2JKLDbDJvbDnUfP3HQMonDh8ebG7MJUntKHQtBqOO5hvvOn6O3MAaeMKmDloOW-TB5bbPLUQF5l8-sq0x0bOte-bQbG_E5bj2qRIDVCK-3f; COOKIE_SESSION=34_3_9_4_6_8_0_2_8_4_349_0_123520_126271_14_2_1594158200_1594158188_1594158186%7C9%2334_37_1594158186%7C7; BDRCVFR[feWj1Vr5u3D]=I67x6TjHwwYf0; H_PS_645EC=5a54xGwzTBF0Zql8nKCt1twSy3EjpXAz1zKvnAw6DVbw3cMTBgDXr6MvTFEpGbl4289v; H_PS_PSSID=1446_32124_32140_31253_32045_32231_32259_26350_22160',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Encoding':'gzip, deflate, br',
}
let spider=new Spider({
    crawler:{
        maxConnections: 10,
        jquery:false,
        callback: function (error, res) {
            if (error) {
                console.log(error);
            } else {
                console.log(res.statusCode)
                console.log(res.body.toString());
            }
        },
    },
    puppeteer:{
        base:{
            ///headless:true,
        },
        extra: {

        }
    }
})

spider.crawler.on('drain',function(){
    console.log('completed')
})

spider.crawler.on('schedule',function(option){
    option.url='https://www.baidu.com/s?wd=ip'
    option.charset='utf-8'
    option.proxy='socks5://127.0.0.1:1080'
})

spider.crawler.queue({url:'https://www.qq.com',headers:headers,timeout:5000,jquery:true,charset:'gb2312',callback:function(err,res){
    if(err)
        throw err
    let $=res.$
    console.log($('title').text())
    }})

spider.puppeteer.on('drain',function(){
    console.log('finish')
})

spider.puppeteer.on('request',function(interceptedRequest,opt){
    if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg')|| interceptedRequest.url().endsWith('.ico')|| interceptedRequest.url().endsWith('.gif'))
        interceptedRequest.abort()
    else
        interceptedRequest.continue()
})

let cookie=new Cookie()
var cookieStr='BIDUPSID=C72A4D41C2B6707CB82AA04E298A690F; PSTM=1566923817; BDUSS=ViLU8wUi1vZVNDc0Y2THdHb3hCRTBjYmRLMTgxUGl4SmdKVTN3c1Q2cFdUdzVlRVFBQUFBJCQAAAAAAAAAAAEAAAA4vbUdQW5nbGVfU2VhbgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFbC5l1WwuZdTH; BAIDUID=CDE2B1BBBF28C29C9955503B6F6F3579:FG=1; H_WISE_SIDS=142529_146743_142018_145945_145497_147027_147280_146536_146308_145931_131246_144681_141261_144741_144251_146574_146869_127969_147350_147321_146750_145418_146732_145875_146205_131423_146801_128699_142209_146002_145601_128149_107317_145288_146594_146136_139910_147295_146824_146396_144966_147301_145608_146305_141910_145396_143857_146791_139913_110085; BD_UPN=123353; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; delPer=0; BD_CK_SAM=1; shifen[6848923_20970]=1594146472; BD_HOME=1; PSINO=6; ZD_ENTRY=baidu; shifen[164502915102_90964]=1594158154; shifen[158193834993_84627]=1594158187; BCLID=9642913741736442289; BDSFRCVID=eNKOJeC629_m27or3yowUlangtfN8Q6TH6aoN5c7j1R0Ov8DwwEDEG0Pof8g0KubZujCogKKKmOTH18F_2uxOjjg8UtVJeC6EG0Ptf8g0f5; H_BDCLCKID_SF=tRk8oI0aJDvjDb7GbKTMbtCSbfTJetJyaR3D0hOvWJ5WqR7jDpnmW-CXDP5h-lQQKCoM0lvcbfL5ShbXXMoMQnFLWhbitttO3HcwhD5S3l02V-bv-fJf5qRDhpAO04RMW20j0h7mWIQvsxA45J7cM4IseboJLfT-0bc4KKJxbnLWeIJEjjC5D5JLjH8et6nE2I5L3Rn2bPt_D-TR2-5Bq4tHepb8BxRZ5mAqoJRI-l6aM4_R2tnB3tA_hxJdWl3GQ2QnaIQqabDVVb3P2-QjDMbDLxRPa-b43bRTWMKy5KJvfJoqDJbMhP-UyPRLWh37tRblMKoaMp78jR093JO4y4Ldj4oxJpOJ5JbMonLafD_BMCD9jjKben-W5gThK4cE2TT0QTrJabC3eqroXU6qLT5XeJnLJjby-J78W-3Ganj_ePbIX67Gjl0njxQyWjQ2JKLDbDJvbDnUfP3HQMonDh8ebG7MJUntKHQtBqOO5hvvOn6O3MAaeMKmDloOW-TB5bbPLUQF5l8-sq0x0bOte-bQbG_E5bj2qRIDVCK-3f; BDRCVFR[feWj1Vr5u3D]=I67x6TjHwwYf0; H_PS_PSSID=1446_32124_32140_31253_32045_32231_32259_26350_22160; H_PS_645EC=6f410v06nzXDWrYjwHxaKHuCoqiTS258JCcM%2BoMgcYyR2kPTCplcGy8lJcmGqctJXoO%2F; BDSVRTM=121; COOKIE_SESSION=34_3_9_4_6_8_1_2_8_4_349_0_123520_126271_14_2_1594158200_1594158188_1594158186%7C9%2334_37_1594158186%7C7'
cookie.add(cookieStr,'https://www.baidu.com',{domain:'.baidu.com'})
let j=cookie.getJar()

spider.puppeteer.queue({
    url:'https://www.baidu.com/s?wd=ip',
    timeout:'10000',
    proxy:'socks5://127.0.0.1:1080',
    jar:j,
    callback:async function(err,page){
        if(err){
            throw err
        }
        let $=page.$
        console.log($('title').text())
    }
})