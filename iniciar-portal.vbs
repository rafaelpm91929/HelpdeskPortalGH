Set WshShell = CreateObject("WScript.Shell")
' 1. Iniciar el Backend de Node.js en segundo plano (oculto)
WshShell.Run "cmd /c C:\Users\AdministradorVw1\Desktop\HelpdeskPortal\start-backend.bat", 0, false
' 2. Asegurar que Nginx se inicie en segundo plano (oculto)
WshShell.Run "cmd /c cd C:\nginx\nginx-1.31.3 && start nginx", 0, false