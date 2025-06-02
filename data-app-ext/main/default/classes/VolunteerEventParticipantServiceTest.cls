/**
 * This class contains unit tests for validating the behavior of Apex classes
 * and triggers.
 *
 * Unit tests are class methods that verify whether a particular piece
 * of code is working properly. Unit test methods take no arguments,
 * commit no data to the database, and are flagged with the testMethod
 * keyword in the method definition.
 *
 * All test methods in an org are executed whenever Apex code is deployed
 * to a production org to confirm correctness, ensure code
 * coverage, and prevent regressions. All Apex classes are
 * required to have at least 75% code coverage in order to be deployed
 * to a production org. In addition, all triggers must have some code coverage.
 * 
 * The @isTest class annotation indicates this class only contains test
 * methods. Classes defined with the @isTest annotation do not count against
 * the org size limit for all Apex scripts.
 *
 * See the Apex Language Reference for more information about Testing and Code Coverage.
 */
@isTest
private class VolunteerEventParticipantServiceTest {

@isTest
    static void testGetParticipantsByRecordId() {
        // Create a test record
        mvpbo3__Volunteer_Event_Participant_Home__dlm volEventPartRec = new mvpbo3__Volunteer_Event_Participant_Home__dlm();
        volEventPartRec.mvpbo3__Id__c = 'TestId';
        volEventPartRec.mvpbo3__Name__c = 'Test Name';
        insert volEventPartRec;

        // Set up the test data
        Id recordId = volEventPartRec.Id;

        // Call the method being tested
        Test.startTest();
        List<Object> result = VolunteerEventParticipantService.getParticipantsByRecordId(recordId);
        Test.stopTest();

        // Assert that the result is not null and contains the expected data
        System.assertNotEquals(null, result);
        System.assertEquals(1, result.size());

        Map<String, Object> record = result[0];
        System.assertEquals(volEventPartRec.mvpbo3__Id__c, record.get('mvpbo3__Id__c'));
        System.assertEquals(volEventPartRec.mvpbo3__Name__c, record.get('mvpbo3__Name__c'));
    }
}