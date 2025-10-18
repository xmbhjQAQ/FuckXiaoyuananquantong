# FuckXiaoyuananquantong

一个用户脚本，旨在自动化处理“校园安全通”平台的任务，包括跳过部分限制以及使用 AI 自动完成答题。

## ✨ 功能特性

-   **破解时间限制**: 自动跳过图片翻页的30秒硬性等待时间。
-   **AI 自动答题**: 在“章节测试”、“模拟考试”和“消除错题”页面，点击“AI答题 & 交卷”按钮，即可利用 AI 自动完成所有题目。
-   **自动跳转与提交**: 在章节学习页面，脚本会自动尝试跳转到“章节测试”部分。答题完成后，脚本会自动提交试卷并确认。
-   **高兼容性**: 完美兼容“章节测试”、“模拟考试”和“消除错题”三种主要的答题场景。

## 🚀 如何使用

1.  **安装用户脚本管理器**: 首先，你需要在你的浏览器上安装一个用户脚本管理器，例如 [Tampermonkey](https://www.tampermonkey.net/) (油猴)。

2.  **安装本脚本**: 将 `Fuck校园安全通 v1.0.js` 文件的内容复制到 Tampermonkey 的新脚本中。

3.  **配置脚本**: 这是最重要的一步。你需要编辑脚本，填入你自己的 AI 服务信息。打开 Tampermonkey 管理面板，找到名为 `Fuck校园安全通 v1.0` 的脚本并点击编辑。

    **第一处修改：配置API密钥和地址**
    在代码的 `AI配置区` 部分，修改以下三个变量：
    ```javascript
    // --- 1. AI配置区  ---
    const API_KEY = 'sk-***********************'; // 换成你的API Key
    const API_URL = '[http://api.example.com/v1/chat/completions](http://api.example.com/v1/chat/completions)'; // 换成你的API Endpoint
    const MODEL = 'deepseek-chat'; // 你想使用的模型，建议使用 deepseek-chat
    // --- 配置区结束 ---
    ```
    -   `API_KEY`: 你的 AI 服务提供商的 API 密钥。
    -   `API_URL`: 你的 API 请求地址。脚本兼容 OpenAI 格式的 API，你可以使用例如 `oneapi` 等聚合平台。
    -   `MODEL`: 你希望使用的具体 AI 模型名称。脚本作者建议使用 `deepseek-chat` 以获得最佳性价比。

    **第二处修改：授权脚本访问你的API域名**
    在脚本头部的 `==UserScript==`区域，找到 `@connect` 这几行。为了让脚本能够成功访问你刚才填写的 `API_URL`，你需要将 `API_URL` 中的域名添加到 `@connect` 列表中。

    例如，如果你的 `API_URL` 是 `http://api.example.com/v1/chat/completions`，那么域名就是 `api.example.com`。你需要将下面这行：
    ```javascript
    // @connect      ************* //这里换成你的endpoint的域名
    ```
    修改为：
    ```javascript
    // @connect      api.example.com
    ```
    **注意：** 如果不进行此项修改，脚本将无法连接到你的AI服务，导致AI答题功能失效。

4.  **开始使用**: 保存脚本后，访问“校园安全通”的相关页面，脚本会自动运行。在答题页面，你会看到一个悬浮的 **“🚀 AI答题 & 交卷”** 按钮，点击它即可开始自动化流程。

## 🎯 支持页面

本脚本会自动在以下页面运行：

-   章节学习与测试: `*://wap.xiaoyuananquantong.com/guns-vip-main/wap/article*`
-   模拟考试: `*://wap.xiaoyuananquantong.com/guns-vip-main/wap/simulate*`
-   消除错题: `*://wap.xiaoyuananquantong.com/guns-vip-main/wap/clearWrong*`

## ⚠️ 免责声明

-   本脚本仅供学习和技术交流使用，请勿用于任何商业或非法用途。
-   使用 AI 服务可能会产生费用，请根据你所使用的服务提供商的政策自行承担。
-   对于因使用本脚本而可能导致的任何后果，作者概不负责。

## 📄 许可证

本项目采用 [知识共享署名-非商业性使用 4.0 国际许可协议 (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans) 进行许可。
简单来说，你可以自由地：
- **共享** — 在任何媒介以任何形式复制、发行本作品
- **演绎** — 修改、转换或以本作品为基础进行创作

只要你遵守以下许可协议条款：
- **署名** — 您必须给出适当的署名，提供指向本许可协议的链接，同时标明是否（对原始作品）作了修改。
- **非商业性使用** — 您不得将本作品用于商业目的。
