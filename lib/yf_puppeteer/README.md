# yf_pup
#pupteer封装的网络请求库

const request=require('./yf_pup')

request(option,callback) 

    /***********************************
     * 发起一个网络请求,完成或结束都会立即断开连接,如果带有callback参数,则为回调函数版本,没带callback参数,则为Promise版本
     *
     * @param {object} [option] Optional settings
     * @param {string} [option.url] url <https://www.baidu.com>
     * @param {string} [option.proxy] the proxy <http://12.34.56.78:2580><socks5://12.34.56.78:1080>
     * @param {object} [option.headers] 浏览器请求头,默认不带请求头
     * @param {number} [option.timeout] 请求超时时间,单位毫秒,默认15秒
     * @param {string} [option.charset] 编码,默认utf-8
     * @param {bool}   [option.loadStatic] 是否加载静态资源，包括css,jpg,png,ico,gif,mp4,默认false
     * @param {bool}   [option.headless] 是否启用无头模式,默认false
     * @param {string} [option.waitForSelector] 等待的元素，默认无
     * @param {number} [option.waitForTimeout] 页面加载完成后再等多长时间，默认无
     * @param {string} [option.waitUntil] 默认domcontentloaded，可选networkidle0，networkidle2，
     * @param {object} [option.puppeteer] 默认{}，官方文档puppeteer.launch([options])中的options参数
     * @param {function} [cb] callback,<function(err,res){}> 完成后的回调函数,res里通常有用的信息是res.headers{object},res.body{Buffer},res.statusCode{number},res.options{object}(就是你请求参数的option)
     *
     */

