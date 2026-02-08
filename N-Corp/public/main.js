$("div.sidebar button#open").click(() => {
    $("aside.sidebar")
        .removeClass("hidden").toggleClass("-translate-x-full");
    $(".content")
        .addClass("hidden"); $("div.sidebar button#open").addClass("hidden"); $("div.sidebar button#close").removeClass("hidden");
});

$("div.sidebar button#close").click(() => {
    $("aside.sidebar")
        .addClass("hidden").toggleClass("-translate-x-full");
    $(".content")
        .removeClass("hidden"); $("div.sidebar button#open").removeClass("hidden"); $("div.sidebar button#close").addClass("hidden");
});

function setupTabs() {
    setTimeout(() => {
        document.querySelectorAll("div.controls div.pages > button").forEach((Ele, i) => {
            $(Ele).click(() => {
                document.querySelectorAll("div.controls div.pages > button").forEach(Ele => {
                    $(Ele)
                        .addClass("bg-gray-950")
                        .removeClass("bg-gray-800").removeClass("text-red-500");
                });

                $(Ele)
                    .removeClass("bg-gray-950")
                    .addClass("bg-gray-800").addClass("text-red-500");
                $("div.controls div.pages > div.page").addClass("hidden");
                $(`div.controls div.pages > div.page[page-id="${i}"]`).removeClass("hidden");
            });
        });
    }, 300);
};