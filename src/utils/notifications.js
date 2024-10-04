function createToast(message, isError) {
    const toast = document.createElement('div');
    toast.classList = 'Polaris-Frame-ToastManager__ToastWrapper';

    const toastInner = document.createElement('div');
    toastInner.classList = 'Polaris-Frame-Toast';

    if (isError) {
        toastInner.classList.add('Polaris-Frame-Toast--error');
    }

    toastInner.textContent = message;

    toast.append(toastInner);

    return toast;
}

function showToast(toastContainer, toast, duration) {
    //needs to apply translateY(-100%)
    toast.classList.add('Polaris-Frame-ToastManager__ToastWrapper--enter', 'Polaris-Frame-ToastManager--toastWrapperEnterDone');

    setTimeout(() => {
        toast.classList.add('transformUp');
    }, 1);
    toast.addEventListener('transitionend', () => {
        toast.classList.remove('Polaris-Frame-ToastManager__ToastWrapper--enter');
        toast.classList.add('Polaris-Frame-ToastManager--toastWrapperEnterDone');
    });

    toastContainer.append(toast);

    setTimeout(() => {
        toast.classList.remove('transformUp');

        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}

export function notify({ message, duration = 5000, isError }) {
    const toastContainer = document.querySelector('.Polaris-Frame-ToastManager');

    const toast = createToast(message, isError);

    showToast(toastContainer, toast, duration);

    return toast;
}
