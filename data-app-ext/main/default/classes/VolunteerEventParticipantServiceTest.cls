/**
 * Test class for the VolunteerEventParticipantService class.
 */
@isTest
private class VolunteerEventParticipantServiceTest {
  @isTest
  static void testGetParticipantsByRecordId() {
    // This Id is passed to your service method. Its actual value might be
    // less critical if your mock doesn't specifically use it to vary the response,
    // but it's still part of the input to the method under test.
    Id testEventRecordId = 'a01xx00000zyxwV'; // Dummy or representative Id

    Test.startTest();
    // Call the method from VolunteerEventParticipantService.cls
    List<Object> results = VolunteerEventParticipantService.getParticipantsByRecordId(
      testEventRecordId
    );
    Test.stopTest();

    // --- Assertions ---
    System.assertNotEquals(
      null,
      results,
      'The result list should not be null.'
    );
    // We added two rows in our mock data
    System.assertEquals(
      2,
      results.size(),
      'The result list should contain two records based on the mock.'
    );

    if (results.size() == 2) {
      // Check first record (transformed into Map<String, Object> by your service)
      Map<String, Object> record1 = (Map<String, Object>) results[0];
      System.assertEquals(
        'mockDlmId001',
        record1.get('mvpbo3__Id__c'),
        'Record 1: ID from mock mismatch.'
      );
      System.assertEquals(
        'Test Participant Mock Name',
        record1.get('mvpbo3__Name__c'),
        'Record 1: Name from mock mismatch.'
      );
      System.assertNotEquals(
        null,
        record1.get('mvpbo3__CreatedDate__c'),
        'Record 1: CreatedDate should be present.'
      );
      System.assertEquals(
        '003xx00000abcdEFG',
        record1.get('mvpbo3__mvpbo3_Participant_c__c'),
        'Record 1: Participant SFID mismatch.'
      );
      System.assertEquals(
        'a01xx00000zyxwVUT',
        record1.get('mvpbo3__mvpbo3_Volunteer_Event_c__c'),
        'Record 1: Event SFID mismatch.'
      );

      // Check second record
      Map<String, Object> record2 = (Map<String, Object>) results[1];
      System.assertEquals(
        'mockDlmId002',
        record2.get('mvpbo3__Id__c'),
        'Record 2: ID from mock mismatch.'
      );
      System.assertEquals(
        'Another Mock Participant',
        record2.get('mvpbo3__Name__c'),
        'Record 2: Name from mock mismatch.'
      );
    }
  }
}
