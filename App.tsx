import { View, Dimensions, TouchableOpacity, Text } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const convertoToDegrees = (angle: number) => {
  return angle * (180 / Math.PI);
};

/**
 * Animation steps
 * 1. Show the first image ✅
 * 2. From horizontal to full screen ✅
 * 3. Show the second image ✅
 * 4. From horizontal to full screen ✅
 * 5. Rotate the diagonal from 180 to 0 based on the screen size ✅
 * 6. Add a white border to the diagonal line with a width of 5 ✅
 */
export default function AnimatedStyleUpdateExample(props) {
  const [{ height, width }, setScreenSize] = useState<{
    height: number;
    width: number;
  }>(() => {
    const { height, width } = Dimensions.get("screen");
    return {
      height,
      width,
    };
  });

  const screenDiagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

  const diagonalAngleInDegrees = useMemo(() => {
    const angle = Math.atan(width / height); // divide it by 180; // Returns the arctangent of a number in radians.

    return {
      positive: convertoToDegrees(angle),
      negative: convertoToDegrees(-angle),
    };
  }, [width, height]);

  const [showResetButton, setShowResetButton] = useState<boolean>(false);

  const screenOpacity = useSharedValue(1);

  const borderWidth = useSharedValue(0);
  const secondCardOpacity = useSharedValue(0);
  const firstCardTranslateX = useSharedValue(width * -1);
  const animatedDiagonalPositiveAngle = useSharedValue(0);
  const animatedDiagonalNegativeAngle = useSharedValue(0);

  const firstCardContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: firstCardTranslateX.value }],
    };
  }, []);

  const secondCardContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: secondCardOpacity.value,
    };
  }, []);

  const diagonalPositiveStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${animatedDiagonalPositiveAngle.value}deg`,
        },
      ],
    };
  }, []);

  const diagonalNegativeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${animatedDiagonalNegativeAngle.value}deg`,
        },
      ],
    };
  }, []);

  const resetButtonTimeoutCallback = useCallback(() => {
    setTimeout(() => {
      setShowResetButton(true);
    }, 3000);
  }, []);

  const runAnimations = useCallback(() => {
    setShowResetButton(false);

    // reset all the values
    screenOpacity.value = 1;
    borderWidth.value = 0;
    secondCardOpacity.value = 0;
    firstCardTranslateX.value = width * -1;
    animatedDiagonalPositiveAngle.value = 0;
    animatedDiagonalNegativeAngle.value = 0;

    secondCardOpacity.value = withTiming(
      1,
      {
        duration: 500,
        easing: Easing.bounce,
        reduceMotion: ReduceMotion.System,
      },
      () => {
        firstCardTranslateX.value = withDelay(
          700,
          withTiming(
            0,
            {
              duration: 500,
              easing: Easing.inOut(Easing.circle),
              reduceMotion: ReduceMotion.System,
            },
            () => {
              animatedDiagonalPositiveAngle.value = withTiming(
                diagonalAngleInDegrees.positive,
                {
                  duration: 500,
                  easing: Easing.bounce,
                  reduceMotion: ReduceMotion.System,
                }
              );
              animatedDiagonalNegativeAngle.value = withTiming(
                diagonalAngleInDegrees.negative,
                {
                  duration: 500,
                  easing: Easing.bounce,
                  reduceMotion: ReduceMotion.System,
                },
                () => {
                  const invokeResetButtonTimeoutCallback = () => {
                    return () => {
                      runOnJS(resetButtonTimeoutCallback)();
                    };
                  };

                  borderWidth.value = withSequence(
                    withTiming(10, {
                      easing: Easing.bounce,
                      reduceMotion: ReduceMotion.System,
                    }),
                    withTiming(0, {
                      easing: Easing.bounce,
                      reduceMotion: ReduceMotion.System,
                    }),
                    withTiming(
                      height,
                      {
                        easing: Easing.elastic(5),
                        reduceMotion: ReduceMotion.System,
                      },
                      () => {
                        screenOpacity.value = withSequence(
                          withTiming(0, {
                            duration: 500,
                            easing: Easing.inOut(Easing.linear),
                          }),
                          withTiming(1, {
                            duration: 500,
                            easing: Easing.inOut(Easing.linear),
                          })
                        );
                      }
                    ),
                    withTiming(
                      2.5,
                      {
                        easing: Easing.bounce,
                        reduceMotion: ReduceMotion.System,
                      },
                      invokeResetButtonTimeoutCallback()
                    )
                  );
                }
              );
            }
          )
        );
      }
    );
  }, [
    diagonalAngleInDegrees,
    resetButtonTimeoutCallback,
    width,
    height,
    runOnJS,
    withDelay,
    withSequence,
    withTiming,
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      ({ screen: { height, width } }) => {
        setScreenSize({ height, width });

        cancelAnimation(screenOpacity);
        cancelAnimation(borderWidth);
        cancelAnimation(secondCardOpacity);
        cancelAnimation(firstCardTranslateX);
        cancelAnimation(animatedDiagonalPositiveAngle);
        cancelAnimation(animatedDiagonalNegativeAngle);
      }
    );
    return () => subscription?.remove();
  }, [setScreenSize]);

  useEffect(() => {
    runAnimations();
  }, [runAnimations]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          height,
          width,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
          opacity: screenOpacity,
          // transform: [{ scale: 0.5 }],
        }}
      >
        {showResetButton && (
          <TouchableOpacity
            style={{
              position: "absolute",
              backgroundColor: "white",
              padding: 10,
              zIndex: 10,
              borderRadius: 30,
              width: 60,
              height: 60,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={runAnimations}
          >
            <Text>Reset</Text>
          </TouchableOpacity>
        )}
        <Animated.View // Card 1 Container
          style={[
            {
              zIndex: 1,
              position: "absolute",
              height,
              width,
              overflow: "hidden",
            },
            firstCardContainerStyle,
          ]}
        >
          <Animated.View // Border
            style={[
              {
                zIndex: 2,
                justifyContent: "flex-start",
                alignItems: "flex-end",
                height: screenDiagonal,
                width,
                position: "absolute",
                bottom: 0,
                right: 0,
                transformOrigin: "bottom right",
                overflow: "hidden",
                borderColor: "white",
                borderRightWidth: borderWidth,
                // backgroundColor: "blue",
                // opacity: 0.5,
              },
              diagonalNegativeStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                justifyContent: "flex-start",
                alignItems: "flex-end",
                height: screenDiagonal,
                width,
                position: "absolute",
                bottom: 0,
                right: 0,
                transformOrigin: "bottom right",
                overflow: "hidden",
                // borderColor: "white",
                // borderRightWidth: 5,
                // backgroundColor: "blue",
                // opacity: 0.5,
              },
              diagonalNegativeStyle,
            ]}
          >
            <Animated.Image
              source={require("./assets/Itachi.png")}
              resizeMode="cover"
              style={[
                {
                  height: screenDiagonal,
                  width,
                  transformOrigin: "bottom right",
                },
                diagonalPositiveStyle,
              ]}
            />
          </Animated.View>
        </Animated.View>

        {/**
         * Card 2
         */}
        <Animated.View
          style={[
            {
              position: "absolute",
              height,
              width,
              overflow: "hidden",
            },
            secondCardContainerStyle,
          ]}
        >
          <Animated.View // Border
            style={[
              {
                zIndex: 2,
                height: screenDiagonal,
                width,
                position: "absolute",
                top: 0,
                left: 0,
                transformOrigin: "top left",
                borderColor: "white",
                borderLeftWidth: borderWidth,
                overflow: "hidden",
                // backgroundColor: "blue",
              },
              diagonalNegativeStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                height: screenDiagonal,
                width,
                position: "absolute",
                top: 0,
                left: 0,
                transformOrigin: "top left",
                // borderColor: "white",
                // borderLeftWidth: 5,
                overflow: "hidden",
                // backgroundColor: "blue",
                // opacity: 0.5,
              },
              diagonalNegativeStyle,
            ]}
          >
            <Animated.Image
              source={require("./assets/gaara.png")}
              resizeMode="cover"
              style={[
                {
                  height: screenDiagonal,
                  width,
                  transformOrigin: "top left",
                },
                diagonalPositiveStyle,
              ]}
            />
          </Animated.View>
        </Animated.View>

        {/**
         * End Card 2
         */}
      </Animated.View>
    </View>
  );
}
