import {NitroModules} from 'react-native-nitro-modules';
import type * as ContactsModuleSpec from './specs/ContactsModule.nitro';
import type * as AppStartTimeModuleSpec from './specs/AppStartTimeModule.nitro';

const ContactsNitroModule = NitroModules.createHybridObject<ContactsModuleSpec.ContactsModule>('ContactsModule');
const AppStartTimeNitroModule = NitroModules.createHybridObject<AppStartTimeModuleSpec.AppStartTimeModule>('AppStartTimeModule');

export {ContactsNitroModule, AppStartTimeNitroModule};
export * from './specs/ContactsModule.nitro';
export * from './specs/AppStartTimeModule.nitro';
