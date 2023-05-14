console.log("App loaded..");

document.getElementById("texForm").addEventListener("submit", function (event) {
    event.preventDefault();

    console.log("executed");

    var fileInput = document.getElementById("texFile");
    var file = fileInput.files[0];

    var texCode = document.getElementById("texCode").value;

    if (texCode.trim() === "") {
        return;
    }

    console.log("texCode: ", texCode);

    console.log("file: ", file);

    if (file) {
        var formData = new FormData();
        formData.append("texFile", file);
        console.log("sent")

        fetch("http://localhost:3000/compile", {
            method: "POST",
            body: formData,
        })
            .then(response => response.blob())
            .then(blob => {
                const pdfUrl = URL.createObjectURL(blob);

                const pdfContainer = document.getElementById("pdfContainer");
                pdfContainer.innerHTML = `<embed src="${pdfUrl}" width="100%" height="100%" type="application/pdf" />`;
            })
            .catch(error => console.error(error));
    } else if (texCode) {
        postTexCode();
    }
});

async function postTexCode() {
    const response = await fetch("http://localhost:3000/compile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ texCode }),
    });

    console.log("response: ", response);

    if (!response.ok) {
        console.error("Request failed with status: ", response.status);
        return;
    }

    const buffer = await response.arrayBuffer();

    console.log("buffer: ", buffer);

    const pdfBlob = new Blob([buffer], { type: "application/pdf" });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    console.log("pdfUrl: ", pdfUrl);

    const tempURL = "file://wsl.localhost/Ubuntu/home/thesvaneman/projects/node-tex-server/tex-server/pdf-document-output/pdf-output-SunMay142023.pdf"

    const pdfContainer = document.getElementById("pdfContainer");
    pdfContainer.innerHTML = `<embed src="${tempURL}" width="100%" height="100%" type="application/pdf" />`;

    const iframeRef = document.getElementById("inlineFrameExample");
    iframeRef.setAttribute("src", tempURL)
}
