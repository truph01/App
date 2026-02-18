import {getStandardExportTemplateDisplayName} from '@libs/AccountingUtils';
import {getExportTemplates} from '@libs/actions/Search';
import {getConnectedIntegrationNamesForPolicies} from '@libs/PolicyUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {ExportTemplate} from '@src/types/onyx';
import useLocalize from './useLocalize';
import useOnyx from './useOnyx';

type UseExportedToFilterDataResult = {
    exportedToFilterOptions: string[];
    combinedUniqueExportTemplates: ExportTemplate[];
    connectedIntegrationNames: Set<string>;
};

/**
 * Hook that prepares all data needed for the exported to search filter.
 * It collects export templates and all connected integrations to build the filter options.
 */
export default function useExportedToFilterOptions(): UseExportedToFilterDataResult {
    const {translate, localeCompare} = useLocalize();
    const [integrationsExportTemplates] = useOnyx(ONYXKEYS.NVP_INTEGRATION_SERVER_EXPORT_TEMPLATES, {canBeMissing: true});
    const [csvExportLayouts] = useOnyx(ONYXKEYS.NVP_CSV_EXPORT_LAYOUTS, {canBeMissing: true});
    const [policies] = useOnyx(ONYXKEYS.COLLECTION.POLICY, {canBeMissing: true});

    const policyLevelExportTemplates = Object.values(policies ?? {}).flatMap((policy) => getExportTemplates([], {}, translate, policy, false));
    const accountLevelExportTemplates = getExportTemplates(integrationsExportTemplates ?? [], csvExportLayouts ?? {}, translate, undefined, true);
    const combinedExportTemplates = [...accountLevelExportTemplates, ...policyLevelExportTemplates];

    const uniqueExportTemplatesByName = new Map<string, ExportTemplate>();
    for (const template of combinedExportTemplates) {
        if (!uniqueExportTemplatesByName.has(template.templateName)) {
            uniqueExportTemplatesByName.set(template.templateName, template);
        }
    }

    const combinedUniqueExportTemplates = Array.from(uniqueExportTemplatesByName.values());

    const standardExportTemplates: string[] = [];
    const customExportTemplates: string[] = [];
    for (const template of combinedUniqueExportTemplates) {
        const displayName = getStandardExportTemplateDisplayName(template.templateName);
        const isStandardTemplate = displayName !== template.templateName;

        if (isStandardTemplate) {
            standardExportTemplates.push(displayName);
        } else {
            customExportTemplates.push(template.name ?? template.templateName);
        }
    }

    customExportTemplates.sort((a, b) => localeCompare(a, b));

    const connectedIntegrationNames = getConnectedIntegrationNamesForPolicies(policies);

    const displayNameToConnectionName = new Map<string, string>(
        Object.entries(CONST.POLICY.CONNECTIONS.NAME_USER_FRIENDLY).map(([connectionName, displayName]) => [displayName, connectionName]),
    );

    const connectedIntegrationDisplayNames = CONST.POLICY.CONNECTIONS.EXPORTED_TO_INTEGRATION_DISPLAY_NAMES.filter((displayName) => {
        const connectionName = displayNameToConnectionName.get(displayName);
        return connectionName && connectedIntegrationNames.has(connectionName);
    });

    const exportedToFilterOptions = [...connectedIntegrationDisplayNames, ...customExportTemplates, ...standardExportTemplates];

    return {
        exportedToFilterOptions,
        combinedUniqueExportTemplates,
        connectedIntegrationNames,
    };
}
