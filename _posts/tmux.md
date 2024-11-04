`tmux` 是一个强大的终端复用器，可以让用户在一个窗口中运行多个会话，并在会话之间轻松切换。它的功能特别适合开发者和系统管理员，允许用户管理多个任务而不需要打开多个终端窗口。下面是 `tmux` 的详细使用指南，包括所有基本指令和示例。

### 1. 安装 tmux

在不同操作系统中，您可以通过包管理器安装 `tmux`。

#### 在 Ubuntu/Debian 系统中：

```bash
sudo apt update
sudo apt install tmux
```

#### 在 CentOS/RHEL 系统中：

```bash
sudo yum install tmux
```

#### 在 macOS 中：

使用 Homebrew：

```bash
brew install tmux
```

### 2. 启动 tmux

打开终端并输入以下命令来启动 `tmux`：

```bash
tmux
```

您将进入一个新的 `tmux` 会话。默认情况下，它会显示一个绿色的状态栏。

### 3. 基本操作

#### 3.1 分离与恢复会话

- **分离当前会话**（detach）：

```bash
Ctrl + b, d
```

- **恢复会话**（attach）：

列出所有会话：

```bash
tmux ls
```

恢复特定会话（假设会话名为 `0`）：

```bash
tmux attach-session -t 0
```

### 4. 窗口与面板管理

#### 4.1 创建和管理窗口

- **创建新窗口**：

```bash
Ctrl + b, c
```

- **切换到下一个窗口**：

```bash
Ctrl + b, n
```

- **切换到上一个窗口**：

```bash
Ctrl + b, p
```

- **切换到特定窗口**（假设窗口编号为 `0`）：

```bash
Ctrl + b, 0
```

- **关闭当前窗口**：

```bash
Ctrl + b, & 
```

#### 4.2 面板管理

- **水平分割当前面板**：

```bash
Ctrl + b, "
```

- **垂直分割当前面板**：

```bash
Ctrl + b, %
```

- **在面板之间切换**：

```bash
Ctrl + b, o
```

- **关闭当前面板**：

```bash
Ctrl + b, x
```

- **调整面板大小**：

按下 `Ctrl + b`，然后按住 `Ctrl` 并使用箭头键来调整面板大小。

### 5. 会话管理

#### 5.1 创建和命名会话

- **创建新会话并命名**：

```bash
tmux new -s mysession
```

#### 5.2 列出会话

```bash
tmux ls
```

#### 5.3 切换会话

```bash
tmux attach-session -t mysession
```

#### 5.4 删除会话

```bash
tmux kill-session -t mysession
```

### 6. 自定义 tmux

#### 6.1 配置文件

`tmux` 的配置文件通常位于 `~/.tmux.conf`。您可以通过编辑该文件来修改 `tmux` 的默认行为和键绑定。

**示例配置**（在 `~/.tmux.conf` 中添加）：

```bash
# 更改前缀键
set-option -g prefix C-a
unbind-key C-b

# 使用鼠标
set -g mouse on

# 设置窗格之间的切换
bind -n C-j select-pane -D
bind -n C-k select-pane -U
bind -n C-h select-pane -L
bind -n C-l select-pane -R
```

加载配置文件：

```bash
tmux source-file ~/.tmux.conf
```

### 7. 键盘快捷键

以下是一些常用的 `tmux` 键盘快捷键：

| 操作                      | 快捷键                  |
| ------------------------- | ----------------------- |
| 前缀键（默认 `Ctrl + b`） | `Ctrl + b`              |
| 创建新会话                | `tmux new -s <name>`    |
| 列出会话                  | `tmux ls`               |
| 恢复会话                  | `tmux attach -t <name>` |
| 分离会话                  | `Ctrl + b, d`           |
| 创建新窗口                | `Ctrl + b, c`           |
| 切换窗口                  | `Ctrl + b, n` / `p`     |
| 关闭窗口                  | `Ctrl + b, &`           |
| 水平分割面板              | `Ctrl + b, "`           |
| 垂直分割面板              | `Ctrl + b, %`           |
| 切换面板                  | `Ctrl + b, o`           |
| 关闭面板                  | `Ctrl + b, x`           |
| 调整面板大小              | `Ctrl + b` + 箭头键     |
| 查看帮助                  | `Ctrl + b, ?`           |

### 8. 常见场景

#### 8.1 运行长时间任务

您可以在一个 `tmux` 会话中运行长时间运行的任务，并在需要时分离会话：

```bash
tmux new -s longtask
# 运行您的长时间任务
```

分离后，您可以在任何时间恢复该会话：

```bash
tmux attach -t longtask
```

#### 8.2 多人协作

您可以在同一个会话中与其他人协作，只需给他们提供访问权限：

1. 启动 `tmux` 会话，使用您的用户或与其他用户共享。
2. 其他用户可以通过 SSH 连接到同一台机器，执行以下命令：

```bash
tmux attach-session -t <your-session-name>
```

### 9. 故障排除

- **无法连接到会话**：确保会话仍在运行并且没有被关闭。
- **键绑定不起作用**：检查 `~/.tmux.conf` 是否正确配置，并尝试重新加载配置。
- **分离会话后无法恢复**：确认您没有在其他地方打开相同的会话。

### 10. 退出 tmux

- **退出所有会话并关闭 tmux**：

在每个窗口中输入：

```bash
exit
```

- **强制退出 tmux**：

```bash
tmux kill-server
```

### 11. 结论

`tmux` 是一个功能强大的工具，适用于需要多任务处理和会话管理的用户。通过熟练掌握它的基本命令和功能，您可以提高工作效率并简化终端操作。希望这个指南能够帮助您更好地使用 `tmux`！