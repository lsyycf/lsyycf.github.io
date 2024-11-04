在 Linux 中，命令行是与操作系统交互的主要方式。以下是一些常用的基本命令，详细介绍了它们的用法、选项和示例。

## 1. `ls` - 列出目录内容

`ls` 命令用于列出目录中的文件和子目录。

### 用法
```bash
ls [选项] [文件或目录]
```

### 常用选项
- `-l`：长格式列出文件信息（包括权限、所有者、大小等）。
- `-a`：显示所有文件，包括以 `.` 开头的隐藏文件。
- `-h`：以可读性更好的格式显示文件大小（与 `-l` 一起使用）。
- `-R`：递归列出所有子目录。

### 示例
```bash
ls
ls -l
ls -la
ls -lh
ls -R
```

## 2. `cp` - 复制文件和目录

`cp` 命令用于复制文件或目录。

### 用法
```bash
cp [选项] 源文件 目标文件
```

### 常用选项
- `-r`：递归复制目录及其内容。
- `-i`：在覆盖文件之前提示确认。
- `-u`：仅在源文件比目标文件新时进行复制。

### 示例
```bash
cp file.txt /path/to/destination/
cp -r /source/directory /destination/
cp -i file.txt /path/to/destination/
```

## 3. `mv` - 移动文件和重命名

`mv` 命令用于移动文件或目录，也可以用来重命名文件。

### 用法
```bash
mv [选项] 源文件 目标文件
```

### 常用选项
- `-i`：在覆盖文件之前提示确认。
- `-u`：仅在源文件比目标文件新时进行移动。

### 示例
```bash
mv file.txt /path/to/destination/
mv oldname.txt newname.txt
mv -i file.txt /path/to/destination/
```

## 4. `rm` - 删除文件和目录

`rm` 命令用于删除文件和目录。

### 用法
```bash
rm [选项] 文件
```

### 常用选项
- `-r`：递归删除目录及其内容。
- `-i`：在删除文件之前提示确认。
- `-f`：强制删除文件，不提示。

### 示例
```bash
rm file.txt
rm -r directory/
rm -i file.txt
rm -rf directory/
```

## 5. `grep` - 文本搜索工具

`grep` 命令用于搜索文本文件中的特定字符串。

### 用法
```bash
grep [选项] PATTERN [文件...]
```

### 常用选项
- `-i`：忽略大小写。
- `-r`：递归搜索目录。
- `-v`：反转匹配，显示不包含模式的行。
- `-n`：显示匹配行的行号。

### 示例
```bash
grep "pattern" file.txt
grep -i "pattern" file.txt
grep -r "pattern" /path/to/directory/
grep -v "pattern" file.txt
grep -n "pattern" file.txt
```

## 6. `nvidia-smi` - NVIDIA GPU 管理工具

`nvidia-smi` 是一个命令行实用程序，提供 NVIDIA GPU 的状态和性能信息。

### 用法
```bash
nvidia-smi [选项]
```

### 常用选项
- `--query-gpu`：查询 GPU 属性。
- `--query-compute-apps`：查询计算应用程序信息。
- `--help`：显示帮助信息。

### 示例
```bash
nvidia-smi
nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv
nvidia-smi --query-compute-apps=pid,gpu_uuid,process_name --format=csv
```

当然，下面是对第 8 到第 22 条命令的详细介绍，格式与前面保持一致。

---

## 8. `pwd` - 显示当前目录

`pwd` 命令用于显示当前工作目录的完整路径。

### 用法
```bash
pwd
```

### 示例
```bash
pwd
```
输出类似：
```
/home/user
```

---

## 9. `cd` - 更改目录

`cd` 命令用于更改当前工作目录。

### 用法
```bash
cd [目录]
```

### 示例
```bash
cd /path/to/directory  # 更改到指定目录
cd ..  # 返回上一级目录
cd ~   # 返回用户主目录
cd -   # 返回上一次访问的目录
```

---

## 10. `mkdir` - 创建目录

`mkdir` 命令用于创建新目录。

### 用法
```bash
mkdir [选项] 目录
```

### 常用选项
- `-p`：递归创建目录结构，创建父目录（如果不存在）。

### 示例
```bash
mkdir new_directory  # 创建新目录
mkdir -p parent_directory/child_directory  # 递归创建目录
```

---

## 11. `rmdir` - 删除空目录

`rmdir` 命令用于删除空目录。

### 用法
```bash
rmdir 目录
```

### 示例
```bash
rmdir empty_directory  # 删除一个空目录
```

---

## 12. `touch` - 创建空文件或更新文件时间戳

`touch` 命令用于创建一个新的空文件，或者更新已有文件的时间戳。

### 用法
```bash
touch 文件名
```

### 示例
```bash
touch newfile.txt  # 创建一个空文件
```

---

## 13. `cat` - 连接文件并打印到标准输出

`cat` 命令用于显示文件内容，连接多个文件并输出。

### 用法
```bash
cat [选项] 文件...
```

### 常用选项
- `-n`：为输出的每一行添加行号。
- `-b`：只为非空行添加行号。

### 示例
```bash
cat file.txt  # 显示文件内容
cat file1.txt file2.txt > combined.txt  # 合并多个文件内容
cat -n file.txt  # 显示文件内容并为每行添加行号
```

---

## 14. `echo` - 打印字符串到标准输出

`echo` 命令用于在终端上打印字符串或变量的值。

### 用法
```bash
echo [选项] [字符串]
```

### 常用选项
- `-n`：不在输出末尾添加换行符。

### 示例
```bash
echo "Hello, World!"  # 打印字符串
echo -n "Hello"  # 打印字符串但不换行
```

---

## 15. `chmod` - 修改文件权限

`chmod` 命令用于更改文件或目录的权限。

### 用法
```bash
chmod [选项] 权限 文件
```

### 权限格式
- `r`：读权限
- `w`：写权限
- `x`：执行权限

权限模式：
- 数字方式：`r=4`, `w=2`, `x=1`。例如 `chmod 755` 表示 `rwxr-xr-x`。
- 符号方式：`+`（添加权限）、`-`（删除权限）、`=`（设置权限）。

### 示例
```bash
chmod 755 file.txt  # 设置权限为 rwxr-xr-x
chmod -R 755 directory/  # 递归设置目录权限
```

---

## 16. `chown` - 更改文件所有者和组

`chown` 命令用于更改文件或目录的所有者和组。

### 用法
```bash
chown [选项] 用户:组 文件
```

### 常用选项
- `-R`：递归更改目录和其内容的所有者和组。

### 示例
```bash
chown user:group file.txt  # 更改文件的所有者和组
chown -R user:group directory/  # 递归更改目录的所有者和组
```

---

## 17. `df` - 显示文件系统磁盘空间占用情况

`df` 命令用于显示文件系统的磁盘空间使用情况。

### 用法
```bash
df [选项]
```

### 常用选项
- `-h`：以人类可读的格式显示（如 KB、MB、GB）。

### 示例
```bash
df -h  # 以人类可读的格式显示磁盘空间占用情况
```

---

## 18. `du` - 显示目录或文件的磁盘使用情况

`du` 命令用于显示目录或文件的磁盘使用情况。

### 用法
```bash
du [选项] [文件或目录]
```

### 常用选项
- `-h`：以人类可读的格式显示。
- `-s`：仅显示总计。
- `-a`：显示所有文件和目录。

### 示例
```bash
du -h  # 显示当前目录及其子目录的磁盘使用情况
du -sh *  # 显示每个子目录的大小
```

---

## 19. `top` - 实时显示进程信息

`top` 命令用于实时查看系统进程和资源使用情况。

### 用法
```bash
top
```

### 示例
```bash
top  # 实时显示系统进程信息
```

---

## 20. `ps` - 查看当前运行的进程

`ps` 命令用于显示当前正在运行的进程。

### 用法
```bash
ps [选项]
```

### 常用选项
- `aux`：显示所有用户的所有进程。
- `-ef`：显示详细进程信息。

### 示例
```bash
ps aux  # 显示所有用户的所有进程
ps -ef  # 显示详细信息
```

---

## 21. `kill` - 终止进程

`kill` 命令用于发送信号以终止进程。

### 用法
```bash
kill [选项] PID
```

### 常用选项
- `-9`：强制终止进程。

### 示例
```bash
kill 1234  # 发送 SIGTERM 信号，终止进程 1234
kill -9 1234  # 强制终止进程 1234
```

---

## 22. `man` - 查看命令的手册页

`man` 命令用于查看命令的使用说明和手册。

### 用法
```bash
man 命令
```

### 示例
```bash
man ls  # 查看 ls 命令的手册页
man grep  # 查看 grep 命令的手册页
```

## 23. 总结

以上是一些常用的 Linux 基本命令及其用法。这些命令可以帮助您在命令行环境中高效地管理文件、目录和系统资源。熟练掌握这些命令是成为 Linux 用户的重要一步。