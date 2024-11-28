import { EventData, Page, Frame } from '@nativescript/core';
import { MainViewModel } from './main-view-model';

export function navigatingTo(args: EventData) {
    const page = <Page>args.object;
    if (!page.bindingContext) {
        page.bindingContext = new MainViewModel();
    }
}

export function onLoaded(args: EventData) {
    const page = <Page>args.object;
    const vm = page.bindingContext as MainViewModel;
    
    if (!vm.isConnected) {
        vm.showConnectionModal();
    }
}