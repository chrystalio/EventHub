import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div
                className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-sky-500">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate font-semibold leading-none">EventHub ITEBA</span>
            </div>
        </>
    );
}
