import os
import sys
import pypandoc

def convert_md_to_docx(file_id, md_folder_path, docx_folder_path):
    """
    将指定的Markdown文件转换为Docx格式
    
    参数:
    file_id: str, 文件ID（不含扩展名）
    md_folder_path: str, Markdown文件所在文件夹路径
    docx_folder_path: str, 输出Docx文件的文件夹路径
    """
    
    # 确保目标文件夹存在
    if not os.path.exists(docx_folder_path):
        os.makedirs(docx_folder_path)
    
    # 构建文件路径
    md_file_path = os.path.join(md_folder_path, f"{file_id}.md")
    docx_file_path = os.path.join(docx_folder_path, f"{file_id}.docx")
    
    # 检查源文件是否存在
    if not os.path.exists(md_file_path):
        print(f"Error: Source file '{md_file_path}' not found")
        return False
    
    # 执行转换
    try:
        # 使用额外参数确保正确处理Markdown
        pypandoc.convert_file(
            md_file_path, 
            'docx', 
            format='markdown-auto_identifiers',
            outputfile=docx_file_path,
            extra_args=['--standalone']
        )
        print(f"Converted '{md_file_path}' to '{docx_file_path}'")
        return True
    except Exception as e:
        print(f"Conversion error: {e}")
        return False

if __name__ == "__main__":
    # 检查参数数量
    if len(sys.argv) != 4:
        print("Usage: python md-to-docx.py <file_id> <md_folder_path> <docx_folder_path>")
        sys.exit(1)
    
    file_id = sys.argv[1]
    md_folder = sys.argv[2]
    docx_folder = sys.argv[3]
    
    success = convert_md_to_docx(file_id, md_folder, docx_folder)
    sys.exit(0 if success else 1)
