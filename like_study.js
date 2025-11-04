// ==UserScript==
// @name         Like Study
// @namespace    https://github.com/lk5103613/like_study/blob/main/like_study.js
// @version      1.1
// @description  学无止境
// @author       Like
// @match        https://jnftc.jnbank.com.cn/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jnbank.com.cn
// @updateURL https://raw.githubusercontent.com/lk5103613/like_study/refs/heads/main/like_study.js
// @downloadURL https://raw.githubusercontent.com/lk5103613/like_study/refs/heads/main/like_study.js
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_addValueChangeListener
// @grant GM.addValueChangeListener
// @grant GM_removeValueChangeListener
// @grant GM.removeValueChangeListener
// @grant unsafeWindow
// @grant window.close
// @grant window.focus
// @grant window.onurlchange
// ==/UserScript==

(async function () {
    'use strict';

    // Your code here...

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const subjectUrl = `${window.location.protocol}//${window.location.host}/WebTraining/Web/MyDuty/MyDutyList.aspx?Menu=9`
    const username = '320401198912172219'
    const pwd = 'Like5103613'
    const commentMsg = 'Good'

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    class Constants {
        static SUBJECT_LIST = 'subject_list'
        static TMP_COURSE_LIST = 'tmp_course_list'
        static COURSE_LIST = 'course_list'
        static VIDEO_LIST = 'video_list'
        static VIDEO_DETAIL = 'video_detail'
        static COURSE_FINISH = "course_finish"
        static REFRESH_COURSE = "refresh_course"

        static clear() {
            GM_deleteValue(Constants.SUBJECT_LIST)
            GM_deleteValue(Constants.TMP_COURSE_LIST)
            GM_deleteValue(Constants.COURSE_LIST)
            GM_deleteValue(Constants.VIDEO_LIST)
            GM_deleteValue(Constants.COURSE_FINISH)
            GM_deleteValue(Constants.REFRESH_COURSE)
        }
    }

    class DomHelper {
        static findElementWithWait(finder, timeout = 500, maxAttempts = 1000000) {
            return new Promise((resolve, reject) => {
                let attempts = 0
                const check = () => {
                    const ele = finder();
                    // 统一检查元素是否有效（存在且非空）
                    const isValid = ele && (ele.length === undefined || ele.length > 0);
                    if (isValid) {
                        resolve(ele)
                    } else if (attempts < maxAttempts) {
                        attempts++
                        setTimeout(check, timeout)
                    } else {
                        resolve(null)
                    }
                }
                check()
            })
        }

        static refresh() {
            window.location.reload()
        }

        static async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    class IndexHandler {
        static isMatch() {
            const href = window.location.href
            return href.indexOf('WebSite/Index.aspx') >= 0 || href.indexOf('WebSite/index.aspx') >= 0
                || href.indexOf('Website/Index.aspx') >= 0 || href.indexOf('website/index.aspx') >= 0
        }

        static async clickLogin() {
            const loginEles = await DomHelper.findElementWithWait(() => document.getElementsByClassName('theme-login'))
            if (loginEles.length > 0 && loginEles[0]) {
                loginEles[0].click()
            }
        }

        static async inputLoginInfo() {
            const usernameEle = await DomHelper.findElementWithWait(() => document.getElementById('Top1_txtuser'))
            const pwdEle = await DomHelper.findElementWithWait(() => document.getElementById('Top1_txtpass'))
            if (usernameEle) {
                usernameEle.value = username
            }
            if (pwdEle) {
                pwdEle.value = pwd
            }
        }

        static async toMySubject() {
            GM_deleteValue(Constants.SUBJECT_LIST)
            await DomHelper.findElementWithWait(() => document.getElementsByClassName('theme-login2'))
            window.open(subjectUrl)
        }
    }

    if (IndexHandler.isMatch()) {
        Constants.clear()
        IndexHandler.clickLogin()
        IndexHandler.inputLoginInfo()
        IndexHandler.toMySubject()
        const listenerId = GM_addValueChangeListener(Constants.SUBJECT_LIST, async (key, oldValue, newValue, remote) => {
            GM_removeValueChangeListener(listenerId)
            await loopSubject(0, newValue)
        })
    }

    async function loopSubject(index, subjectList) {
        if (index >= subjectList.length) {
            return
        }
        let currentSubject = subjectList[index]
        await new Promise(resolve => {
            const listenerId = GM_addValueChangeListener(Constants.COURSE_LIST, async (key, oldValue, newValue, remote) => {
                GM_removeValueChangeListener(listenerId)
                await loopCourse(0, newValue)
                resolve(newValue)
            })
            window.open(currentSubject.url)
        })
        await loopSubject(index + 1, subjectList)
    }

    async function loopCourse(index, courseList) {
        if (index >= courseList.length) {
            return
        }
        const finishListenerId = GM_addValueChangeListener(Constants.COURSE_FINISH, async (key, oldValue, newValue, remote) => {
            GM_removeValueChangeListener(finishListenerId)
            GM_deleteValue(Constants.COURSE_FINISH)
            await loopCourse(index + 1, courseList)
        })
        let currentCourse = courseList[index]
        await new Promise(resolve => {
            const listenerId = GM_addValueChangeListener(Constants.VIDEO_LIST, async (key, oldValue, newValue, remote) => {
                GM_removeValueChangeListener(listenerId)
                await loopVideo(0, newValue)
                resolve(newValue)
            })
            window.open(currentCourse.url)
        })
    }

    async function loopVideo(index, videoList) {
        if (index >= videoList.length) {
            await CourseHandler.checkStatus()
            return
        }
        let currentVideo = videoList[index]
        await new Promise(resolve => {
            const listenerId = GM_addValueChangeListener(Constants.VIDEO_DETAIL, async (key, oldValue, newValue, remote) => {
                GM_removeValueChangeListener(listenerId)
                GM_deleteValue(Constants.VIDEO_DETAIL)
                resolve(newValue)
            })
            window.open(currentVideo.url)
        })
        await loopVideo(index + 1, videoList)
    }

    class SubjectHandler {
        static isMatch() {
            const href = window.location.href
            return href.indexOf('MyDuty/MyDutyList.aspx') >= 0
        }

        static async getList() {
            const subjectEleList = await DomHelper.findElementWithWait(() => document.querySelectorAll('#lblCurrDuty > div > div'))
            const subjectList = []
            for (let subjectEle of subjectEleList) {
                const linkEle = subjectEle.querySelector('.Duty a')
                const titleEle = subjectEle.querySelectorAll('div')[1]
                subjectList.push({
                    id: generateUUID(),
                    title: titleEle.innerHTML,
                    url: linkEle.href,
                    courseList: []
                })
            }
            GM_setValue(Constants.SUBJECT_LIST, subjectList)
            window.close()
        }
    }

    if (SubjectHandler.isMatch()) {
        SubjectHandler.getList()
    }

    class SubjectDetailHandler {
        static isMatch() {
            const href = window.location.href
            return href.indexOf('DutyShow.aspx') >= 0
        }

        static async getPageInfo() {
            const tabEleList = await DomHelper.findElementWithWait(() => document.querySelectorAll('.tab li'))
            if (tabEleList[1].className.indexOf('on') < 0) {
                ChangeTab(1)
            }
            await DomHelper.wait(1000)
            const pageEleList = await DomHelper.findElementWithWait(() => document.querySelectorAll('.pageInfo'), 1000, 3)
            let totalPage = 1
            let currentPage = 1
            if (pageEleList != null) {
                const totalEle = document.getElementById('PageSplit1_LbPageCount')
                const currentEle = document.getElementById('PageSplit1_LbPageIndex')
                if (totalEle && currentEle) {
                    totalPage = parseInt(totalEle.innerHTML)
                    currentPage = parseInt(currentEle.innerHTML)
                    if (totalPage === 0) {
                        totalPage = 1
                    }
                }
            }
            if (currentPage <= totalPage) {
                if (currentPage === 1) {
                    GM_deleteValue(Constants.TMP_COURSE_LIST)
                }
                await this.getCourseList()
                if (currentPage < totalPage) {
                    const nextEle = document.getElementById('PageSplit1_BtnNext')
                    nextEle.click()
                } else {
                    window.close()
                    const courseList = GM_getValue(Constants.TMP_COURSE_LIST, [])
                    GM_deleteValue(Constants.TMP_COURSE_LIST)
                    GM_setValue(Constants.COURSE_LIST, courseList)
                }
            }
        }

        static async getCourseList() {
            const tmpCourseList = GM_getValue(Constants.TMP_COURSE_LIST, [])
            const courseEleList = await DomHelper.findElementWithWait(() => document.querySelectorAll('#ul-2 > li'), 500, 3)
            if (!courseEleList) {
                GM_setValue(Constants.TMP_COURSE_LIST, [])
                return
            }
            for (let courseEle of courseEleList) {
                const tdEleList = courseEle.querySelectorAll('.table0 td')
                const name = tdEleList[1].innerHTML
                console.log(name)
                const infoEle = tdEleList[0]
                let onclickContent = infoEle.querySelector('a').getAttribute('onclick')
                onclickContent = onclickContent.replace("window.open('..", "")
                    .replace("')", "")
                tmpCourseList.push({
                    url: baseUrl + '/WebTraining/Web' + onclickContent,
                    name: name,
                    videoList: []
                })
                GM_setValue(Constants.TMP_COURSE_LIST, tmpCourseList)
            }
        }
    }

    if (SubjectDetailHandler.isMatch()) {
        SubjectDetailHandler.getPageInfo()
    }

    class CourseHandler {

        static isMatch() {
            const href = window.location.href
            return href.indexOf('Layer_CourseInfo.aspx') >= 0
        }

        static async checkStatus() {
            const listenerId = GM_addValueChangeListener(Constants.REFRESH_COURSE, async (name, oldValue, newValue, remote) => {
                GM_removeValueChangeListener(listenerId)
                GM_deleteValue(Constants.REFRESH_COURSE)
                await DomHelper.wait(500)
                DomHelper.refresh()
            })
            if (document.getElementsByClassName('a-2')[0].getAttribute('style').indexOf('ico_kecheng_t3_over.png') < 0) {
                this.getVideoList()
            } else if (document.getElementsByClassName('a-3')[0].getAttribute('style').indexOf('ico_kecheng_t2_over.png') < 0
                && await this.haveExam()) {
                this.goExam()
            } else if (document.getElementsByClassName('a-4')[0].getAttribute('style').indexOf('CourseOver.png') < 0) {
                this.rate()
            }
            if (document.getElementsByClassName('a-4')[0].getAttribute('style').indexOf('CourseOver.png') >= 0) {
                // 课程完成
                GM_setValue(Constants.COURSE_FINISH, true)
                window.close()
            }
        }

        static async getVideoList() {
            const videoEleList = await DomHelper.findElementWithWait(() => document.querySelectorAll('#table tr'))
            const videoList = []
            for (let videoEle of videoEleList) {
                const videoInfoEleList = videoEle.querySelectorAll('td')
                if (videoInfoEleList.length < 3) {
                    continue
                }
                const name = videoInfoEleList[0].innerHTML
                const linkEle = videoInfoEleList[2].querySelector('a')
                let onClickContent = linkEle.getAttribute('onclick')
                onClickContent = onClickContent.replace("Online(", "")
                    .replace(")", "").replace("'", "").trim()
                let videoInfos = onClickContent.split(',')
                const courseWareId = videoInfos[0].replaceAll("'", "")
                const videoName = encodeURIComponent(videoInfos[1].replaceAll("'", "")).replaceAll(/%2F/g, '/').replace(/%E3%80%81/g, '、')
                const courseId = videoInfos[3].replaceAll("'", "")
                // https://jnftc.jnbank.com.cn/WebTraining/Web/MyClass/OnLineRead.aspx?CoursewareId=d91d0580-2ae8-45f2-b86e-a2c62c8c449d&TypeValue=0&Url=2025%u5E74%u91D1%u57F9%u5185%u8BAD%u5E08%u8BFE%u4EF6/5%u3001%u738B%u5353%u621057464/321%u8D37%u6B3E%u50AC%u6536%u6CD5%u5F88%u8F7B%u677E%uFF08%u6539%uFF09%20%282%29.mp4&Type=1&CourseId=b61176db-63f0-4f5d-8f17-56ef7b99f4ed
                const videoUrl = `${baseUrl}/WebTraining/Web/MyClass/OnLineRead.aspx?CoursewareId=${courseWareId}&TypeValue=0&Url=${videoName}&Type=1&CourseId=${courseId}`
                videoList.push({
                    name: name,
                    courseWareId: courseWareId,
                    videoName: videoName,
                    courseId: courseId,
                    url: videoUrl
                })
            }
            GM_setValue(Constants.VIDEO_LIST, videoList)
        }

        static async haveExam() {
            const tabEleList = await DomHelper.findElementWithWait(() => document.querySelectorAll('#TabNav a'))
            if (tabEleList.length < 5) {
                return
            }
            tabEleList[2].click()
            const rowEleList = document.querySelectorAll('.table1 > tbody tr')
            return rowEleList.length > 1
        }

        static async goExam() {
            const rowEleList = document.querySelectorAll('.table1 > tbody tr')
            let onclickContent = rowEleList[1].querySelectorAll('td')[4].querySelector('a').getAttribute('onclick')
            const examId = onclickContent.replace("CreateExam('", "")
                .replace("')", "")
            //         this.url = host + "WebTraining/Web/MyExam/aspNet/ExamCreate.ashx?Tk_Cl_Id=" + examId + "&Clerk_id=" + studentId + "&SiteType=";
            const functionSource = btnGiveUp_onclick.toString();
            const match = functionSource.match(/var\s+sStudentId\s*=\s*['"]([^'"]+)['"]/);
            if (match) {
                const sStudentId = match[1];
                const url = `${baseUrl}/WebTraining/Web/MyExam/aspNet/ExamCreate.ashx?Tk_Cl_Id=${examId}&Clerk_id=${sStudentId}&SiteType=`
                window.open(url)
            }
        }

        static async rate() {
            await DomHelper.wait(1000)
            if (document.getElementsByClassName('a-4')[0].getAttribute('style').indexOf('CourseOver.png') >= 0) {
                window.close()
                return
            }
            document.getElementById('txtArea').value = commentMsg
            document.getElementById('HidSpell').value = 5
            document.getElementById('SubComment').click()
        }
    }

    if (CourseHandler.isMatch()) {
        CourseHandler.checkStatus()
        // CourseHandler.rate()
    }

    class VideoHandler {
        static isMatch() {
            const href = window.location.href
            return href.indexOf('OnLineRead.aspx') >= 0
        }

        static isMatchSetTime() {
            return window.location.href.indexOf('SetTime.ashx') >= 0
        }

        static async learn() {
            await DomHelper.wait(3000)
            const loginIdEle = await DomHelper.findElementWithWait(() => document.getElementById('txtLoginInfoId'))
            const loginId = loginIdEle.value
            const duration = parseInt(document.getElementsByTagName('video')[0].duration) + 120
            window.open(`${baseUrl}/WebTraining/Web/MyClass/SetTime.ashx?LoginInfoId=${loginId}&pTime=${duration}`)
            await DomHelper.wait(2000)
            window.close()
        }

    }

    if (VideoHandler.isMatch()) {
        await VideoHandler.learn()
    }

    if (VideoHandler.isMatchSetTime()) {
        await DomHelper.wait(1000)
        GM_setValue(Constants.REFRESH_COURSE, true)
        window.close()
    }

    class ExamHandler {

        static ANSWER_FLAG = 'answer_flag'

        static isMatchMain() {
            const href = window.location.href
            return href.indexOf('ExamDo.aspx') >= 0
        }

        static isMatchHeader() {
            const href = window.location.href
            return href.indexOf('ExamHeader.aspx') >= 0
        }

        static waitAnswer() {
            const listenerId = GM_addValueChangeListener(ExamHandler.ANSWER_FLAG, (key, oldValue, newValue, remote) => {
                GM_removeValueChangeListener(listenerId)
                SubmitExam()
                GM_deleteValue(ExamHandler.ANSWER_FLAG)
            })
        }

        static async answer() {
            console.log('answer')
            const questionEleList = await DomHelper.findElementWithWait(() => document.querySelectorAll('.tb_title'))
            for (let i = 1; i <= questionEleList.length; i++) {
                const questionEle = questionEleList[i - 1]
                const answerId = `tmjo_${i}`
                const answerEle = questionEle.querySelector('#' + answerId)
                const answerContent = answerEle.getAttribute('value')
                const answerList = []
                if (answerContent.length > 1) {
                    for (let j = 0; j < answerContent.length; j++) {
                        answerList.push(answerContent[j])
                    }
                } else {
                    answerList.push(answerContent)
                }
                for (let answer of answerList) {
                    let rdoId = `tm_${i}_`
                    switch (answer.toLocaleLowerCase()) {
                        case 'a':
                            rdoId += "0";
                            break;
                        case 'b':
                            rdoId += "1";
                            break;
                        case 'c':
                            rdoId += "2";
                            break;
                        case 'd':
                            rdoId += "3";
                            break;
                        case 'e':
                            rdoId += "4";
                            break;
                        case 'f':
                            rdoId += "5";
                            break;
                        case 'g':
                            rdoId += "6";
                            break;
                        case '0':
                            rdoId += "1";
                            break;
                        case '1':
                            rdoId += "0";
                            break;
                    }
                    document.getElementById(rdoId).click()
                    GM_setValue(ExamHandler.ANSWER_FLAG, 'true')
                }
            }
        }
    }

    if (ExamHandler.isMatchMain()) {
        ExamHandler.answer()
    }
    if (ExamHandler.isMatchHeader()) {
        ExamHandler.waitAnswer()
    }

})()
