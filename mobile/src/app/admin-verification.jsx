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

import {
  supabase,
} from '../lib/supabase';

export default function AdminVerificationScreen() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pendingProfiles,
    setPendingProfiles,
  ] = useState([]);

  const [
    documentUrls,
    setDocumentUrls,
  ] = useState({});

  const [
    processingId,
    setProcessingId,
  ] = useState(null);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
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
        data: adminProfile,
        error:
          adminProfileError,
      } = await supabase
        .from('profiles')
        .select(
          'id, is_admin'
        )
        .eq(
          'id',
          user.id
        )
        .single();

      if (
        adminProfileError
      ) {
        Alert.alert(
          'Error',
          adminProfileError.message
        );

        router.back();
        return;
      }

      if (
        !adminProfile
          ?.is_admin
      ) {
        Alert.alert(
          'Access denied',
          'You do not have permission to access the verification review page.',
          [
            {
              text: 'OK',

              onPress: () =>
                router.back(),
            },
          ]
        );

        return;
      }

      await loadPendingProfiles();
    } catch (error) {
      console.log(
        'ADMIN INIT ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to load admin verification.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingProfiles() {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        student_id,
        faculty,

        student_verified,
        student_card_path,
        student_card_status,

        driver_verified,
        driving_license_path,
        driving_license_status
      `)
      .or(
        'student_card_status.eq.pending,driving_license_status.eq.pending'
      )
      .order(
        'full_name',
        {
          ascending: true,
        }
      );

    if (error) {
      Alert.alert(
        'Error',
        error.message
      );

      return;
    }

    setPendingProfiles(
      data || []
    );

    await loadDocumentUrls(
      data || []
    );
  }

  async function loadDocumentUrls(
    profiles
  ) {
    const nextUrls = {};

    for (
      const profile
      of profiles
    ) {
      if (
        profile.student_card_status ===
          'pending' &&
        profile.student_card_path
      ) {
        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              'verification-documents'
            )
            .createSignedUrl(
              profile.student_card_path,
              60 * 10
            );

        if (
          !error &&
          data?.signedUrl
        ) {
          nextUrls[
            `student-${profile.id}`
          ] =
            data.signedUrl;
        }
      }

      if (
        profile.driving_license_status ===
          'pending' &&
        profile.driving_license_path
      ) {
        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              'verification-documents'
            )
            .createSignedUrl(
              profile.driving_license_path,
              60 * 10
            );

        if (
          !error &&
          data?.signedUrl
        ) {
          nextUrls[
            `driver-${profile.id}`
          ] =
            data.signedUrl;
        }
      }
    }

    setDocumentUrls(
      nextUrls
    );
  }

  function confirmApprove(
    profile,
    type
  ) {
    const label =
      type ===
      'student'
        ? 'student card'
        : 'driving licence';

    Alert.alert(
      'Approve verification?',
      `Approve this ${label} for ${profile.full_name}?`,
      [
        {
          text:
            'Cancel',

          style:
            'cancel',
        },

        {
          text:
            'Approve',

          onPress: () =>
            reviewVerification(
              profile,
              type,
              'approved'
            ),
        },
      ]
    );
  }

  function confirmReject(
    profile,
    type
  ) {
    const label =
      type ===
      'student'
        ? 'student card'
        : 'driving licence';

    Alert.alert(
      'Reject verification?',
      `Reject this ${label} for ${profile.full_name}?`,
      [
        {
          text:
            'Cancel',

          style:
            'cancel',
        },

        {
          text:
            'Reject',

          style:
            'destructive',

          onPress: () =>
            reviewVerification(
              profile,
              type,
              'rejected'
            ),
        },
      ]
    );
  }

  async function reviewVerification(
    profile,
    type,
    decision
  ) {
    const processKey =
      `${type}-${profile.id}`;

    setProcessingId(
      processKey
    );

    try {
      const isApproved =
        decision ===
        'approved';

      const updateData =
        type ===
        'student'
          ? {
              student_card_status:
                decision,

              student_verified:
                isApproved,

              student_verification_reviewed_at:
                new Date().toISOString(),
            }
          : {
              driving_license_status:
                decision,

              driver_verified:
                isApproved,

              driver_verification_reviewed_at:
                new Date().toISOString(),
            };

      const {
        error,
      } = await supabase
        .from('profiles')
        .update(
          updateData
        )
        .eq(
          'id',
          profile.id
        );

      if (error) {
        Alert.alert(
          'Error',
          error.message
        );

        return;
      }

      Alert.alert(
        isApproved
          ? 'Approved'
          : 'Rejected',

        type ===
        'student'
          ? `Student verification has been ${decision}.`
          : `Driver verification has been ${decision}.`
      );

      await loadPendingProfiles();
    } catch (error) {
      console.log(
        'REVIEW ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to update verification status.'
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  function renderStudentVerification(
    profile
  ) {
    if (
      profile.student_card_status !==
      'pending'
    ) {
      return null;
    }

    const url =
      documentUrls[
        `student-${profile.id}`
      ];

    const processKey =
      `student-${profile.id}`;

    const processing =
      processingId ===
      processKey;

    return (
      <View
        style={
          styles.verificationSection
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Student Card
        </Text>

        {url ? (
          <Image
            source={{
              uri: url,
            }}
            style={
              styles.documentImage
            }
            resizeMode="contain"
          />
        ) : (
          <View
            style={
              styles.documentUnavailable
            }
          >
            <Text
              style={
                styles.documentUnavailableText
              }
            >
              Unable to load document preview.
            </Text>
          </View>
        )}

        <View
          style={
            styles.actionRow
          }
        >
          <TouchableOpacity
            onPress={() =>
              confirmApprove(
                profile,
                'student'
              )
            }
            disabled={
              processing
            }
            style={[
              styles.approveButton,

              processing &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={
                styles.approveButtonText
              }
            >
              {processing
                ? 'Processing...'
                : 'Approve'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              confirmReject(
                profile,
                'student'
              )
            }
            disabled={
              processing
            }
            style={[
              styles.rejectButton,

              processing &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={
                styles.rejectButtonText
              }
            >
              Reject
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderDriverVerification(
    profile
  ) {
    if (
      profile.driving_license_status !==
      'pending'
    ) {
      return null;
    }

    const url =
      documentUrls[
        `driver-${profile.id}`
      ];

    const processKey =
      `driver-${profile.id}`;

    const processing =
      processingId ===
      processKey;

    return (
      <View
        style={
          styles.verificationSection
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Driving Licence
        </Text>

        {url ? (
          <Image
            source={{
              uri: url,
            }}
            style={
              styles.documentImage
            }
            resizeMode="contain"
          />
        ) : (
          <View
            style={
              styles.documentUnavailable
            }
          >
            <Text
              style={
                styles.documentUnavailableText
              }
            >
              Unable to load document preview.
            </Text>
          </View>
        )}

        <View
          style={
            styles.actionRow
          }
        >
          <TouchableOpacity
            onPress={() =>
              confirmApprove(
                profile,
                'driver'
              )
            }
            disabled={
              processing
            }
            style={[
              styles.approveButton,

              processing &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={
                styles.approveButtonText
              }
            >
              {processing
                ? 'Processing...'
                : 'Approve'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              confirmReject(
                profile,
                'driver'
              )
            }
            disabled={
              processing
            }
            style={[
              styles.rejectButton,

              processing &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={
                styles.rejectButtonText
              }
            >
              Reject
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
          Loading pending verifications...
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
        Admin Verification
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Review student cards and driving licences.
      </Text>

      {pendingProfiles.length ===
      0 ? (
        <View
          style={
            styles.emptyBox
          }
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            No pending verification
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            All submitted documents have been reviewed.
          </Text>
        </View>
      ) : (
        pendingProfiles.map(
          (profile) => (
            <View
              key={
                profile.id
              }
              style={
                styles.profileCard
              }
            >
              <Text
                style={
                  styles.profileName
                }
              >
                {
                  profile.full_name
                }
              </Text>

              <Text
                style={
                  styles.profileInfo
                }
              >
                Student ID:{' '}
                {
                  profile.student_id ||
                  '-'
                }
              </Text>

              <Text
                style={
                  styles.profileInfo
                }
              >
                Faculty:{' '}
                {
                  profile.faculty ||
                  '-'
                }
              </Text>

              {renderStudentVerification(
                profile
              )}

              {renderDriverVerification(
                profile
              )}
            </View>
          )
        )
      )}
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
      padding: 24,
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
    },

    profileCard: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 16,
      padding: 18,
      marginBottom: 20,
    },

    profileName: {
      fontSize: 20,
      fontWeight:
        'bold',
    },

    profileInfo: {
      marginTop: 5,
      color: '#666',
    },

    verificationSection: {
      marginTop: 20,
      paddingTop: 18,
      borderTopWidth: 1,
      borderTopColor:
        '#eee',
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        'bold',
      marginBottom: 12,
    },

    documentImage: {
      width: '100%',
      height: 240,
      backgroundColor:
        '#f5f5f5',
      borderRadius: 12,
    },

    documentUnavailable: {
      height: 150,
      justifyContent:
        'center',
      alignItems:
        'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
    },

    documentUnavailableText: {
      color: '#666',
      textAlign:
        'center',
    },

    actionRow: {
      flexDirection:
        'row',
      gap: 10,
      marginTop: 15,
    },

    approveButton: {
      flex: 1,
      backgroundColor:
        '#222',
      padding: 14,
      borderRadius: 10,
    },

    approveButtonText: {
      color: 'white',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    rejectButton: {
      flex: 1,
      borderWidth: 1,
      borderColor:
        '#b00020',
      padding: 14,
      borderRadius: 10,
    },

    rejectButtonText: {
      color: '#b00020',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    disabledButton: {
      opacity: 0.5,
    },

    emptyBox: {
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 14,
      padding: 22,
    },

    emptyTitle: {
      fontSize: 19,
      fontWeight:
        'bold',
    },

    emptyText: {
      marginTop: 6,
      color: '#666',
      lineHeight: 20,
    },
  });