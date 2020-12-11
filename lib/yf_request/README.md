# yf_request
#网络请求库
很多第三方网络库是用http核心包封装的,但是因为http核心包有连接复用,缓存等机制,面对大量并发请求时容易出现连接数大量增长甚至内存泄露
所以我用socket封装了一个网络库,请求成功或者超时失败会都会直接立即断开所有相关连接,简单粗暴,没有其他复杂机制

const request=require('./yf_request')

request(option,callback) 

    /***********************************
     * 发起一个网络请求,完成或结束都会立即断开连接,如果带有callback参数,则为回调函数版本,没带callback参数,则为Promise版本
     *
     * @param {object} [option] Optional settings
     * @param {string} [option.url] url <https://www.baidu.com>
     * @param {string} [option.proxy] the proxy <http://12.34.56.78:2580><socks5://12.34.56.78:1080>
     * @param {string} [option.methd] 默认GET,支持GET和POST,POST不同类型数据需要在headers选项添加对应字段
     * @param {string|Buffer|Uint8Array} [option.data] POST的数据,如果方法为GET,该选项无效
     * @param {object} [option.headers] 浏览器请求头,默认不带请求头
     * @param {number} [option.timeout] 请求超时时间,单位毫秒,默认15秒
     * @param {boolean} [option.redirect] 是否重定向,例如302重定向,默认true
     * @param {function} [cb] callback,<function(err,res){}> 完成后的回调函数,res里通常有用的信息是res.headers{object},res.body{Buffer},res.statusCode{number},res.options{object}(就是你请求参数的option)
     *
     */

