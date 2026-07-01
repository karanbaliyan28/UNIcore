
    // Auto-submit on filter change
    document.getElementById("hodStatus").addEventListener("change", () => {
        document.getElementById("hodFilterForm").submit();
    });
    document.getElementById("hodSort").addEventListener("change", () => {
        document.getElementById("hodFilterForm").submit();
    });

    // Auto submit search after typing stops
    let timer;
    const searchBox = document.getElementById("hodSearch");
    searchBox.addEventListener("keyup", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            document.getElementById("hodFilterForm").submit();
        }, 500);
    });
