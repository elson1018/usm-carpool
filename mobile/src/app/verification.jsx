import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';

import {
  router,
} from 'expo-router';

import * as ImagePicker from 'expo-image-picker';

import {
  supabase,
} from '../lib/supabase';

export default function VerificationScreen() {
  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    uploadingStudentCard,
    setUploadingStudentCard,
  ] = useState(false);

  const [
    uploadingLicense,
    setUploadingLicense,
  ] = useState(false);

  const [
    studentCardPreview,
    setStudentCardPreview,
  ] = useState(null);

  const [
    licensePreview,
    setLicensePreview,
  ] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.replace('/login');
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          student_id,
          student_verified,
          student_card_path,
          student_card_status,
          driver_verified,
          driving_license_path,
          driving_license_status
        `)
        .eq(
          'id',
          user.id
        )
        .single();

      if (error) {
        Alert.alert(
          'Error',
          error.message
        );

        return;
      }

      setProfile(data);
    } catch (error) {
      console.log(
        'LOAD VERIFICATION ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to load verification information.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function pickImage() {
    const {
      status,
    } =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (
      status !==
      'granted'
    ) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access to upload your verification document.'
      );

      return null;
    }

    const result =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes:
            ImagePicker
              .MediaTypeOptions
              .Images,

          allowsEditing:
            false,

          quality:
            0.8,
        });

    if (
      result.canceled
    ) {
      return null;
    }

    return result.assets[0];
  }

  async function uploadStudentCard() {
    const image =
      await pickImage();

    if (!image) {
      return;
    }

    setStudentCardPreview(
      image.uri
    );

    await uploadVerificationDocument({
      image,
      type:
        'student-card',
    });
  }

  async function uploadDrivingLicense() {
    const image =
      await pickImage();

    if (!image) {
      return;
    }

    setLicensePreview(
      image.uri
    );

    await uploadVerificationDocument({
      image,
      type:
        'driving-license',
    });
  }

  async function uploadVerificationDocument({
    image,
    type,
  }) {
    const isStudent =
      type ===
      'student-card';

    if (isStudent) {
      setUploadingStudentCard(
        true
      );
    } else {
      setUploadingLicense(
        true
      );
    }

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const extension =
        image.uri
          .split('.')
          .pop()
          ?.toLowerCase() ||
        'jpg';

      const safeExtension =
        extension.split('?')[0];

      const folder =
        isStudent
          ? 'student-cards'
          : 'driving-licenses';

      const filePath =
        `${folder}/${user.id}/${Date.now()}.${safeExtension}`;

      const response =
        await fetch(
          image.uri
        );

      const blob =
        await response.blob();

      const {
        error:
          uploadError,
      } = await supabase.storage
        .from(
          'verification-documents'
        )
        .upload(
          filePath,
          blob,
          {
            contentType:
              image.mimeType ||
              'image/jpeg',

            upsert:
              false,
          }
        );

      if (
        uploadError
      ) {
        console.log(
          'UPLOAD ERROR:',
          uploadError
        );

        Alert.alert(
          'Upload failed',
          uploadError.message
        );

        return;
      }

      const updateData =
        isStudent
          ? {
              student_card_path:
                filePath,

              student_card_status:
                'pending',

              student_verified:
                false,
            }
          : {
              driving_license_path:
                filePath,

              driving_license_status:
                'pending',

              driver_verified:
                false,
            };

      const {
        error:
          profileError,
      } = await supabase
        .from('profiles')
        .update(
          updateData
        )
        .eq(
          'id',
          user.id
        );

      if (
        profileError
      ) {
        console.log(
          'PROFILE UPDATE ERROR:',
          profileError
        );

        Alert.alert(
          'Error',
          profileError.message
        );

        return;
      }

      Alert.alert(
        'Uploaded',
        isStudent
          ? 'Your student card has been submitted for verification.'
          : 'Your driving licence has been submitted for verification.'
      );

      await loadProfile();
    } catch (error) {
      console.log(
        'VERIFICATION UPLOAD ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to upload the document.'
      );
    } finally {
      if (isStudent) {
        setUploadingStudentCard(
          false
        );
      } else {
        setUploadingLicense(
          false
        );
      }
    }
  }

  function getStatusText(
    status
  ) {
    switch (status) {
      case 'pending':
        return 'Pending Review';

      case 'approved':
        return 'Approved';

      case 'rejected':
        return 'Rejected';

      default:
        return 'Not Submitted';
    }
  }

  function getVerificationText(
    verified
  ) {
    return verified
      ? 'Verified'
      : 'Not Verified';
  }

  if (loading) {
    return (
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading verification...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={
        styles.container
      }

      contentContainerStyle={
        styles.content
      }
    >
      <Text
        style={
          styles.title
        }
      >
        Verification
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Verify your student identity
        and driving eligibility.
      </Text>

      {/* STUDENT CARD */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.cardTitle
          }
        >
          Student Verification
        </Text>

        <Text
          style={
            styles.label
          }
        >
          Student ID
        </Text>

        <Text
          style={
            styles.value
          }
        >
          {profile
            ?.student_id ||
            '-'}
        </Text>

        <Text
          style={
            styles.label
          }
        >
          Status
        </Text>

        <Text
          style={
            styles.status
          }
        >
          {getStatusText(
            profile
              ?.student_card_status
          )}
        </Text>

        <Text
          style={
            styles.verificationText
          }
        >
          {getVerificationText(
            profile
              ?.student_verified
          )}
        </Text>

        {studentCardPreview ? (
          <Image
            source={{
              uri:
                studentCardPreview,
            }}
            style={
              styles.preview
            }
            resizeMode="cover"
          />
        ) : null}

        <TouchableOpacity
          onPress={
            uploadStudentCard
          }

          disabled={
            uploadingStudentCard
          }

          style={[
            styles.button,

            uploadingStudentCard &&
              styles.disabledButton,
          ]}
        >
          <Text
            style={
              styles.buttonText
            }
          >
            {uploadingStudentCard
              ? 'Uploading...'
              : profile
                    ?.student_card_status ===
                  'not_submitted'
              ? 'Upload Student Card'
              : 'Upload New Student Card'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DRIVING LICENCE */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.cardTitle
          }
        >
          Driver Verification
        </Text>

        <Text
          style={
            styles.label
          }
        >
          Status
        </Text>

        <Text
          style={
            styles.status
          }
        >
          {getStatusText(
            profile
              ?.driving_license_status
          )}
        </Text>

        <Text
          style={
            styles.verificationText
          }
        >
          {getVerificationText(
            profile
              ?.driver_verified
          )}
        </Text>

        {licensePreview ? (
          <Image
            source={{
              uri:
                licensePreview,
            }}
            style={
              styles.preview
            }
            resizeMode="cover"
          />
        ) : null}

        <TouchableOpacity
          onPress={
            uploadDrivingLicense
          }

          disabled={
            uploadingLicense
          }

          style={[
            styles.button,

            uploadingLicense &&
              styles.disabledButton,
          ]}
        >
          <Text
            style={
              styles.buttonText
            }
          >
            {uploadingLicense
              ? 'Uploading...'
              : profile
                    ?.driving_license_status ===
                  'not_submitted'
              ? 'Upload Driving Licence'
              : 'Upload New Driving Licence'}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={
          styles.noticeBox
        }
      >
        <Text
          style={
            styles.noticeTitle
          }
        >
          Privacy
        </Text>

        <Text
          style={
            styles.noticeText
          }
        >
          Your verification documents
          are stored privately and should
          only be accessible for
          verification purposes.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        'white',
    },

    content: {
      padding: 24,
      paddingTop: 50,
      paddingBottom: 60,
    },

    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 10,
      color: '#666',
    },

    title: {
      fontSize: 32,
      fontWeight:
        'bold',
    },

    subtitle: {
      marginTop: 8,
      marginBottom: 25,
      color: '#666',
      lineHeight: 20,
    },

    card: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 16,
      padding: 18,
      marginBottom: 20,
    },

    cardTitle: {
      fontSize: 20,
      fontWeight:
        'bold',
      marginBottom: 14,
    },

    label: {
      color: '#666',
      marginTop: 10,
      marginBottom: 3,
    },

    value: {
      fontSize: 16,
      fontWeight: '600',
    },

    status: {
      fontSize: 18,
      fontWeight:
        'bold',
    },

    verificationText: {
      marginTop: 5,
      color: '#666',
    },

    preview: {
      width: '100%',
      height: 180,
      borderRadius: 12,
      marginTop: 15,
    },

    button: {
      backgroundColor:
        '#222',
      padding: 15,
      borderRadius: 10,
      marginTop: 18,
    },

    disabledButton: {
      opacity: 0.5,
    },

    buttonText: {
      color: 'white',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    noticeBox: {
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 14,
      padding: 18,
    },

    noticeTitle: {
      fontWeight:
        'bold',
      fontSize: 16,
    },

    noticeText: {
      color: '#666',
      marginTop: 6,
      lineHeight: 20,
    },
  });