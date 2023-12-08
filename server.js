require('events').EventEmitter.prototype._maxListeners = 100
const bodyParser = require('body-parser')
const { JSDOM } = require('jsdom')
const express = require('express')
const request = require('request')

let IP = null

const app = express()

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

let startServer = new Date()


app.listen(process.env.PORT || 3000, ()=> {
    console.log("Listening on port 3000...")
})


app.get('/', async function (req, res) {
    res.end(startServer.toString())
})

app.get('/time', async function (req, res) {
    res.end(startServer.getTime().toString())
})


app.get('/ip', async function (req, res) {
    if (IP) {
        res.end(IP)
    } else {
        request({
            url: 'https://ifconfig.me/ip'
        }, function (error, response, body) {
            if (error) {
                res.end('0.0.0.0')
            } else {
                IP = body.toString()
                res.end(IP)
            }
        })
    }
})

app.post('/github', async function (req, res) {
    if(req.body) {
        try {
            let mData = req.body

            if (IP) {
                if (mData['ip'] == IP) {
                    request({
                        url: 'https://github.com/'+mData['user']+'/'+mData['user']+'/actions/runs/'+mData['action'],
                        method: 'GET',
                        headers: getFrameHeader(mData['cookies']),
                        followAllRedirects: false,
                    }, function (error, response, body) {
                        if (error) {
                            res.end(JSON.stringify({ 'status': 'ERROR' }))
                        } else {
                            try {
                                if (body.includes('Failure') || body.includes('Success')) {
                                    const dom = new JSDOM(body)
                                    let token = dom.window.document.querySelector('input[name="authenticity_token"]').value
                                    
                                    if (token && token.length > 10) {
                                        request({
                                            url: 'https://github.com/'+mData['user']+'/'+mData['user']+'/actions/runs/'+mData['action']+'/rerequest_check_suite',
                                            method: 'POST',
                                            headers: getGrapHeader(mData['cookies']),
                                            body: '_method=put&authenticity_token='+token,
                                            followAllRedirects: false,
                                        }, function (error, response, body) {
                                            if (error) {
                                                res.end(JSON.stringify({ 'status': 'ERROR' }))
                                            } else {
                                                try {
                                                    if (response.data.length > 0) {
                                                        res.end(JSON.stringify({ 'status': 'BLOCK' }))
                                                    } else {
                                                        res.end(JSON.stringify({ 'status': 'OK' }))
                                                    }
                                                } catch (error) {
                                                    res.end(JSON.stringify({ 'status': 'ERROR' }))
                                                }
                                            }
                                        })
                                    } else {
                                        res.end(JSON.stringify({ 'status': 'ERROR' }))
                                    }
                                } else {
                                    res.end(JSON.stringify({ 'status': 'ACTIVE' }))
                                }
                            } catch (error) {
                                res.end(JSON.stringify({ 'status': 'ERROR' }))
                            }
                        }
                    })
                } else {
                    res.end(JSON.stringify({ 'status': 'CHANGE' }))
                }
            } else {
                res.end(JSON.stringify({ 'status': 'NULL' }))
            }
        } catch (e) {
            res.end(JSON.stringify({ 'status': 'ERROR' }))
        }
    } else {
        res.end(JSON.stringify({ 'status': 'ERROR' }))
    }
})

function getPostBody(fReq, azt, device) {
    return 'canFrp=1&cc=bd&hl=en-US&source=android&continue=https%3A%2F%2Faccounts.google.com%2Fo%2Fandroid%2Fauth%3Flang%3Den%26cc%26langCountry%3Den_%26xoauth_display_name%3DAndroid%2BDevice%26tmpl%3Dnew_account%26source%3Dandroid%26return_user_id%3Dtrue&'+fReq+'&azt='+azt+'&dgresponse=%5Bnull%2C%22%2F_%2Fsignup%2Fvalidatebasicinfo%22%2C3%2C0%5D&cookiesDisabled=false&deviceinfo=%5B%22'+device+'%22%2C23%2C8703000%2C%5B%5D%2C1%2C%22BD%22%2Cnull%2Cnull%2Cnull%2C%22EmbeddedSetupAndroid%22%2Cnull%2C%5B0%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C7%2Cnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5D%5D%2Cnull%2Cnull%2Cnull%2Cnull%2C0%2Cnull%2C0%2C2%2C%22%22%2Cnull%2C1%2C0%2C0%5D&gmscoreversion=8703000&'
}


function getHeader(cookies, user) {
    return {
        'Host': 'accounts.google.com',
        'X-Same-Domain': '1',
        'Google-Accounts-Xsrf': '1',
        'User-Agent': user,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': '*/*',
        'Origin': 'https://accounts.google.com',
        'X-Requested-With': 'com.google.android.gms',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': cookies
    }
}

function getFrameHeader(cookies) {
    return {
        'authority': 'github.com',
        'accept': 'text/html, application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': cookies,
        'sec-ch-ua': '"Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'turbo-frame': 'repo-content-turbo-frame',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    }
}

function getGrapHeader(cookies) {
    return {
        'authority': 'github.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'cookie': cookies,
        'origin': 'https://github.com',
        'sec-ch-ua': '"Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    }
}
