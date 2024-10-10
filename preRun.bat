if "%1" equ "" (
    echo preRun
    exit /b 0
) else (
    xcopy /s /e /y .\* %1
    cd /d %1
    git apply .\text.diff
)