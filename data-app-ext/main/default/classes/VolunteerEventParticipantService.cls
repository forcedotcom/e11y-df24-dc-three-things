/**
 * @description Service class for managing Volunteer Event Participants.
 */
public with sharing class VolunteerEventParticipantService {
    @AuraEnabled
    public static List<Object> getParticipantsByRecordId(Id recordId) {
        try {
            ConnectApi.CdpQueryInput query = new ConnectApi.CdpQueryInput();
            // the sql is a string so recordId must be wrapped in single quotes
            query.sql = 'SELECT mvpbo3__Id__c, mvpbo3__Name__c, mvpbo3__CreatedDate__c, mvpbo3__mvpbo3_Participant_c__c, mvpbo3__mvpbo3_Volunteer_Event_c__c FROM mvpbo3__Volunteer_Event_Participant_Home__dlm WHERE mvpbo3__mvpbo3_Volunteer_Event_c__c = \'' + recordId + '\' ORDER BY mvpbo3__CreatedDate__c DESC LIMIT 5';

            ConnectApi.CdpQueryOutputV2 response;
            if(Test.isRunningTest()) {
                    response = new ConnectApi.CdpQueryOutputV2(); // Initialize response object

                // Define Metadata (matching your service's SOQL query structure)
                response.metadata = new Map<String, ConnectApi.CdpQueryMetadataItem>();

                ConnectApi.CdpQueryMetadataItem idMeta = new ConnectApi.CdpQueryMetadataItem();
                idMeta.placeInOrder = 0; 
                idMeta.type = 'STRING'; 
                response.metadata.put('mvpbo3__Id__c', idMeta);

                ConnectApi.CdpQueryMetadataItem nameMeta = new ConnectApi.CdpQueryMetadataItem();
                nameMeta.placeInOrder = 1; 
                nameMeta.type = 'STRING';
                response.metadata.put('mvpbo3__Name__c', nameMeta);

                ConnectApi.CdpQueryMetadataItem createdDateMeta = new ConnectApi.CdpQueryMetadataItem();
                createdDateMeta.placeInOrder = 2; 
                createdDateMeta.type = 'DATETIME'; // Represented as ISO 8601 string in JSON
                response.metadata.put('mvpbo3__CreatedDate__c', createdDateMeta);
                
                ConnectApi.CdpQueryMetadataItem participantMeta = new ConnectApi.CdpQueryMetadataItem();
                participantMeta.placeInOrder = 3; 
                participantMeta.type = 'STRING';
                response.metadata.put('mvpbo3__mvpbo3_Participant_c__c', participantMeta);

                ConnectApi.CdpQueryMetadataItem eventMeta = new ConnectApi.CdpQueryMetadataItem();
                eventMeta.placeInOrder = 4; 
                eventMeta.type = 'STRING';
                response.metadata.put('mvpbo3__mvpbo3_Volunteer_Event_c__c', eventMeta);

                // Define Data Rows
                response.data = new List<ConnectApi.CdpQueryV2Row>();
                ConnectApi.CdpQueryV2Row row1 = new ConnectApi.CdpQueryV2Row();
                row1.rowData = new List<Object>{
                    'mockDlmId001',                                               // mvpbo3__Id__c
                    'Test Participant Mock Name',                                 // mvpbo3__Name__c
                    Datetime.newInstance(2023, 1, 15, 10, 30, 0).formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''), // mvpbo3__CreatedDate__c
                    '003xx00000abcdEFG',                                          // mvpbo3__mvpbo3_Participant_c__c (example SFID)
                    'a01xx00000zyxwVUT'                                           // mvpbo3__mvpbo3_Volunteer_Event_c__c (example SFID)
                };
                response.data.add(row1);

                // Optionally, add a second row for more comprehensive testing
                ConnectApi.CdpQueryV2Row row2 = new ConnectApi.CdpQueryV2Row();
                row2.rowData = new List<Object>{
                    'mockDlmId002',
                    'Another Mock Participant',
                    Datetime.newInstance(2023, 1, 16, 11, 0, 0).formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''),
                    '003xx00000hijklMNO',
                    'a01xx00000qponMLK'
                };
                response.data.add(row2);
            } else {
                response = ConnectApi.CdpQuery.queryAnsiSqlV2(query);
            }  
            Map<String, ConnectApi.CdpQueryMetadataItem> metadata = response.metadata;
            List<ConnectApi.CdpQueryV2Row> data = response.data;

            // List will hold the result once field names and values are joined
            List<Map<String, Object>> result = new List<Map<String, Object>>();

            // Iterate over the data rows
            for (ConnectApi.CdpQueryV2Row row : data) {
                Map<String, Object> record = new Map<String, Object>();

                // Iterate over the metadata to get field names and corresponding values
                for (String fieldName : metadata.keySet()) {
                    record.put(fieldName, row.rowData[Integer.valueOf(metadata.get(fieldName).placeInOrder)]);
                }

            result.add(record);
            }
        // result contains an array of objects that can be easily consumed by LWC
        return result;
    
       
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
