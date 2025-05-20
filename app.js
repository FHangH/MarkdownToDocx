const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 7535;
const HOST = process.env.HOST || '192.168.1.31';
const server = http.createServer(app);

// 中间件设置
app.use(express.json({ limit: '50mb' })); // 解析JSON请求体，增加大小限制
// 在现有中间件下方添加
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // 增加URL编码请求体大小限制
app.use(express.static('public')); // 提供静态文件访问

// 在文件顶部添加日期格式化函数
function formatDate(date) 
{
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}


// 创建目录（如果不存在）
const mdDir = path.join(__dirname, 'public', 'md');
const docxDir = path.join(__dirname, 'public', 'docx');
if (!fs.existsSync(mdDir)) fs.mkdirSync(mdDir, { recursive: true });
if (!fs.existsSync(docxDir)) fs.mkdirSync(docxDir, { recursive: true });

// 现有的GET路由
app.get('/', (req, res) => 
{
    res.send('/convert POST接口实现Markdown转Docx');
});

// 新增POST路由处理Markdown转换
app.post('/convert', (req, res) => 
{
    try 
    {
        const { markdown, api } = req.body;
        const ip = api.split('/')[2].split(':')[0];

        console.log("接收到markdown的内容：", markdown);

        if (!markdown) 
        {
            return res.status(400).json({ success: false, message: 'Markdown content is required', url: null });
        }

        // 处理可能的JSON转义字符
        let processedMarkdown = markdown;
    
        // 如果内容是JSON字符串，尝试解析它
        if (typeof markdown === 'string' && markdown.includes('\\n')) 
        {
            try 
            {
                // 使用JSON.parse处理转义字符
                processedMarkdown = JSON.parse(`"${markdown.replace(/"/g, '\\"')}"`);
            } 
            catch (e) 
            {
                console.warn("JSON解析失败，使用原始内容:", e.message);
            }
        }

        // 生成日期时间前缀和唯一ID
        const datePrefix = formatDate(new Date());
        const fileId = uuidv4();
        const fileName = `${datePrefix}_${fileId}`;
        const mdFilePath = path.join(mdDir, `${fileName}.md`);
        
        // 写入处理后的Markdown文件
        fs.writeFileSync(mdFilePath, processedMarkdown, 'utf8');

        // 调用Python脚本进行转换
        const pythonScript = path.join(__dirname, 'md-to-docx.py');
        // 设置超时选项
        const execOptions = 
        {
            timeout: 300000, // 5分钟超时
            maxBuffer: 1024 * 1024 * 10 // 增加缓冲区大小到10MB
        };

        exec(`python3 "${pythonScript}" "${fileName}" "${mdDir}" "${docxDir}"`, 
        execOptions, (error, stdout, stderr) => 
        {
            if (error) 
            {
                console.error(`执行出错: ${error}`);
                return res.status(500).json({ success: false, message: 'Conversion failed', url: null });
            }
            
            // 构建完整的Docx文件URL (包含主机和端口)
            const docxUrl = `http://${ip}:${PORT}/docx/${fileName}.docx`;
            console.log(`Docx文件URL: ${docxUrl}`);

            res.json({ success: true, message: 'Docx file generated successfully', url: docxUrl });
        });

        console.log("MD目录:", mdDir);
        console.log("DOCX目录:", docxDir);
        console.log("MD文件路径:", mdFilePath);
        console.log("Python命令:", `python ${pythonScript} "${fileName}" "${mdDir}" "${docxDir}"`);

    } 
    catch (error) 
    {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 在应用启动时添加检查
const checkDependencies = () => {
    exec('python3 --version', (error) => {
        if (error) {
            console.error('Python is not installed or not in PATH');
            process.exit(1);
        }
        
        exec('python3 -c "import pypandoc"', (error) => {
            if (error) {
                console.error('pypandoc is not installed. Please install it using: pip install pypandoc');
                process.exit(1);
            }
            console.log('All dependencies are installed correctly.');
        });
    });
};

// 在app.listen之前调用
checkDependencies();

server.timeout = 300000; // 5分钟超时
server.listen(PORT, HOST, () => 
{
    console.log(`Server is running at http://${HOST}:${PORT}`);
});
