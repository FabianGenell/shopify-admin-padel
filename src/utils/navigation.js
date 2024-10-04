let loadedOnce = false;
let loading = true;

//problem is app pages (like online store) because they load inside an iframe.. :(

function startLoad() {
    const observer = new MutationObserver((mutationsList, observer) => {
        if (hasLoadingElements()) {
            loading = true;
            observer.disconnect();
            console.log('Starting load checking');
            loadedOnce = false;
            checkLoaded();
        }
    });

    observer.observe(document, { attributes: true, childList: true, subtree: true });
}

function hasLoadingElements() {
    const el = document.querySelector(
        '#AppFrameLoadingBar, .Polaris-SkeletonBodyText, .Polaris-SkeletonPage__SkeletonTitle'
    );
    return el !== null;
}

//if there are no loading elements, check again after 300ms if there are any (to be sure)
function checkLoaded() {
    setTimeout(() => {
        if (!hasLoadingElements()) {
            if (loadedOnce) {
                sendLoadedMessage();
                loading = false;
                return console.log('Page is now considered loaded');
            }
            loadedOnce = true;
        }
        checkLoaded();
    }, 300);
}

function sendLoadedMessage() {
    const url = new URL(window.location.href);

    const paths = url.pathname.split('/');
    paths.splice(0, 3);

    const variables = {
        detail: {
            url: url,
            location: paths,
            path: paths.join('/')
        }
    };

    const event = `shopify:page-loaded:${paths.join(':')}`;

    setTimeout(() => {
        chrome.runtime.sendMessage({
            type: 'pageLoaded',
            event,
            url: url,
            location: paths,
            path: paths.join('/')
        });
    }, 100);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'webNavigation') {
        console.log('Received message (navigation):', message);
        if (!loading) startLoad();
    }
});

startLoad()
