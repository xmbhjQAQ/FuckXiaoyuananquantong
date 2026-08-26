// ==UserScript==
// @name         Fuck校园安全通 v1.0
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  一个脚本即可完美兼容“章节测试”、“模拟考试”和“消除错题”,自动跳过硬控，AI答题。
// @author       QAQ
// @match        *://wap.xiaoyuananquantong.com/guns-vip-main/wap/article*
// @match        *://wap.xiaoyuananquantong.com/guns-vip-main/wap/newStudentArticle*
// @match        *://wap.xiaoyuananquantong.com/guns-vip-main/wap/simulate*
// @match        *://wap.xiaoyuananquantong.com/guns-vip-main/wap/newStudentssimulate*
// @match        *://wap.xiaoyuananquantong.com/guns-vip-main/wap/clearWrong*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api.openai.com
// @connect      api.groq.com
// @connect      api.moonshot.cn
// @connect      dash.cloudflare.com
// @connect      ************* //这里换成你的endpoint的域名
// @connect      *
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

/* jshint esversion: 8 */

(function() {
    'use strict';
    console.log('【 Fuck校园安全通】: 脚本启动');

    // Part 1: [仅在 article 页面运行] 破解图片翻页的时间限制
    // 修复：覆写 setTimeout/setInterval，将30秒延迟降为0
    // 注意：必须用 unsafeWindow，因为 @grant 模式下 window 是沙箱代理
    if (window.location.href.toLowerCase().includes('article')) {
        const _st = unsafeWindow.setTimeout.bind(unsafeWindow);
        unsafeWindow.setTimeout = (fn, d, ...a) => _st(fn, d === 30000 ? 0 : d, ...a);
        const _si = unsafeWindow.setInterval.bind(unsafeWindow);
        unsafeWindow.setInterval = (fn, d, ...a) => _si(fn, d === 30000 ? 0 : d, ...a);
    }
    
    // Part 2: 主要功能模块
    $(function() {
        console.log('【 Fuck校园安全通 DBG】: Part 2 - DOM加载完成');
        // --- 1. AI配置区  ---
        const API_KEY = 'sk-***********************';
        const API_URL = 'http://*****************/v1/chat/completions'; //自定义你的endpoint(openai格式，可使用例如oneapi等聚合平台)
        const MODEL = 'deepseek-chat'; //支持推理模型，按需填入，建议使用deepseek-chat获得最佳性价比
        // --- 配置区结束 ---

        // 页面适配器
        const href = window.location.href;
        let pageType = '未知';
        let questionSelector = '';

        if (href.toLowerCase().includes('article')) {
            pageType = '章节测试';
            questionSelector = '#dataList ul li';
        } else if (href.toLowerCase().includes('simulate')) {
            pageType = '模拟考试';
            questionSelector = '.minirefresh-scroll ul li';
        } else if (href.includes('/clearWrong')) {
            pageType = '消除错题';
            questionSelector = '.minirefresh-scroll ul li';
        }
        console.log(`【 Fuck校园安全通 LOG】: 当前为 [${pageType}] 页面, 使用选择器: "${questionSelector}"`);


        // 仅在“章节测试”页面执行自动跳转
        if (href.toLowerCase().includes('article')) {
            robustAutoSkip();
        }

        function robustAutoSkip() {
            // ... (此函数未改变)
            console.log('【 Fuck校园安全通 LOG】: Starting robust auto-skip check...');
            let attempts = 0;
            const maxAttempts = 20;
            const interval = 500;
            const skipInterval = setInterval(() => {
                if ($(questionSelector + ':visible').length > 0) { clearInterval(skipInterval); return; }
                if (typeof unsafeWindow.getQuetion === 'function') { unsafeWindow.getQuetion(); clearInterval(skipInterval); return; }
                const $quizTab = $(".chapterTest_tab span:contains('章节测试')");
                if ($quizTab.length > 0) {
                    if (!$quizTab.hasClass('chapterTest_active')) $quizTab.click();
                    clearInterval(skipInterval); return;
                }
                if (++attempts >= maxAttempts) clearInterval(skipInterval);
            }, interval);
        }

        const solveButton = $('<button id="ai-solve-button">🚀 AI答题 & 交卷</button>').css({
            position: 'fixed', bottom: '80px', right: '20px', zIndex: '99999',
            padding: '12px 18px', backgroundColor: '#FF5722', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '16px', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }).appendTo('body').on('click', startAiSolving);

        function waitForQuestions(maxRetries = 20, interval = 500) {
            // ... (此函数未改变)
            return new Promise((resolve, reject) => {
                let retries = 0;
                console.log('【 Fuck校园安全通 LOG】: 等待题目加载...');
                const intervalId = setInterval(() => {
                    // 增加一个判断，如果题目列表存在但内容为空，继续等待
                    const questions = $(questionSelector);
                    if (questions.length > 0 && questions.first().children().length > 0) {
                        clearInterval(intervalId);
                        const visibleQuestions = questions.filter(':visible');
                        console.log(`【 Fuck校园安全通 LOG】: 成功找到 ${visibleQuestions.length} 道题目!`);
                        resolve(visibleQuestions.toArray());
                    } else if (++retries >= maxRetries) {
                        clearInterval(intervalId);
                        // 如果最后还是没找到，检查是否有“暂无错题”之类的提示
                        if ($('.minirefresh-scroll h5').length > 0) {
                            reject('页面提示没有题目。');
                        } else {
                            reject('等待题目超时');
                        }
                    }
                }, interval);
            });
        }

        async function startAiSolving() {
            console.log('【 Fuck校园安全通 LOG】: "AI答题 & 交卷" 按钮被点击。');
            solveButton.text('等待题目...').prop('disabled', true);
            try {
                const questions = await waitForQuestions();
                solveButton.text('AI答题中...');
                let count = 0;
                for (const qElement of questions) {
                    count++;
                    solveButton.text(`答题中 (${count}/${questions.length})`);
                    try {
                        await processSingleQuestion(qElement);
                    } catch (error) {
                         console.error(`【 Fuck校园安全通 ERROR】: 处理第 ${count} 题时发生无法恢复的错误，已跳过。错误详情:`, error);
                    }
                }
                console.log('【 Fuck校园安全通 DBG】: 所有题目循环处理完毕，准备交卷。');

                // ... (后续交卷逻辑未改变，因为所有页面都使用 btnSub)
                $('<div id="all-finished-checkbox" style="position: fixed; bottom: 150px; right: 20px; z-index: 99998; background-color: #4CAF50; color: white; padding: 8px 12px; border-radius: 5px; font-size: 14px;">✔️ 全部完成</div>').appendTo('body');
                solveButton.text('自动交卷中...').css('backgroundColor', '#4CAF50');
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (typeof unsafeWindow.btnSub === 'function') {
                    console.log('【 Fuck校园安全通 LOG】: AI答题完成，调用btnSub()交卷');
                    unsafeWindow.btnSub();
                    const checkInterval = setInterval(() => {
                        const confirmBtn = $('.layui-layer-btn0');
                        if (confirmBtn.length > 0) {
                            confirmBtn.click(); clearInterval(checkInterval);
                            console.log('【 Fuck校园安全通 LOG】: 已自动确认提交！');
                        }
                    }, 200);
                } else {
                    throw new Error('未找到交卷函数 btnSub()');
                }
                solveButton.text('✅ 流程结束').prop('disabled', false);
            } catch (error) {
                console.error('【 Fuck校园安全通 FATAL】: 主流程发生致命错误:', error);
                solveButton.text('❌ 操作失败').css('backgroundColor', 'red').prop('disabled', false);
                alert('操作失败: ' + error);
            }
        }

        async function processSingleQuestion(questionElement) {
            // ... (此函数完全通用，无需改变)
            const $q = $(questionElement);
            const questionText = $q.find('.clearWrong_title').text().replace(/^\d+、(单选题|多选题|判断题)/, '').trim();
            let optionsText = '';
            const options = {};
            $q.find('.test_list p').each((i, el) => {
                const optionLetter = $(el).find('span:first').text().trim();
                const optionFullText = $(el).find('span:last').text().trim();
                optionsText += `${optionLetter}: ${optionFullText}\n`;
                options[optionLetter] = el;
            });
            let prompt = `你是一个答题助手。请根据以下题目和选项，直接返回最正确选项的字母。不要解释，不要说“答案是”或任何其他多余的文字。
- 如果是单选题，返回单个大写字母，例如 "A"。
- 如果是多选题，返回所有正确选项的字母，例如 "ACD"。
- 如果是判断题，"A" 代表 "正确"，"B" 代表 "错误"。
题目类型：${$q.find('.clearWrong_title span').text()}
题目：${questionText}
选项：
${optionsText}`;
            console.log(`【 Fuck校园安全通 DBG】: 准备请求API，题目: "${questionText.substring(0, 20)}..."`);
            const aiAnswer = await callAiApi(prompt);
            console.log(`【 Fuck校园安全通 LOG】: AI返回原始结果: "${aiAnswer}"`);
            if (aiAnswer) {
                const answerLetters = aiAnswer.toUpperCase().match(/[A-F]/g) || [];
                console.log(`【 Fuck校园安全通 DBG】: 解析到答案字母: [${answerLetters.join(', ')}]`);
                for (const letter of answerLetters) {
                    if (options[letter]) {
                        $(options[letter]).click();
                        console.log(`【 Fuck校园安全通 LOG】: 已模拟点击选项 ${letter}`);
                    }
                }
            } else {
                console.warn(`【 Fuck校园安全通 WARN】: AI返回了空结果，跳过此题。`);
            }
        }

        async function callAiApi(prompt, maxRetries = 3) {
            // ... (此函数完全通用，无需改变)
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const result = await new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'POST', url: API_URL,
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                            data: JSON.stringify({
                                model: MODEL, messages: [{ role: 'user', content: prompt }],
                                temperature: 0.1, max_tokens: 500
                            }),
                            timeout: 15000,
                            onload: function(response) {
                                if (response.status >= 200 && response.status < 400) {
                                    try {
                                        const responseJson = JSON.parse(response.responseText);
                                        if (responseJson.choices && responseJson.choices.length > 0) {
                                            const message = responseJson.choices[0].message;
                                            resolve((message.content || message.reasoning_content || '').trim());
                                        } else { resolve(''); }
                                    } catch (e) { reject('解析API响应失败: ' + e); }
                                } else { reject(`API 请求失败: ${response.status} - ${response.statusText}`); }
                            },
                            onerror: (err) => reject(`网络请求错误: ${JSON.stringify(err)}`),
                            ontimeout: (err) => reject(`网络请求超时: ${JSON.stringify(err)}`)
                        });
                    });
                    return result;
                } catch (error) {
                    console.warn(`【 Fuck校园安全通 WARN】: API请求失败 (尝试 ${attempt}/${maxRetries})。错误:`, error);
                    if (attempt === maxRetries) throw new Error(`API 请求在 ${maxRetries} 次尝试后仍然失败`);
                    await new Promise(res => setTimeout(res, 1500));
                }
            }
        }
    });
})();
