import {
  View,
  Dimensions,
  Image,
  Button,
  TouchableOpacity,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const convertoToDegrees = (angle: number) => {
  return angle * (180 / Math.PI);
};

const convertoToStyledSheetDegrees = (degrees: number) => {
  return `${degrees}deg`;
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

  const resetAnimations = () => {
    console.log("🚀 ~ resetAnimations ~ resetAnimations");

    screenOpacity.value = 1;
    borderWidth.value = 0;
    secondCardOpacity.value = 0;
    firstCardTranslateX.value = width * -1;
    animatedDiagonalPositiveAngle.value = 0;
    animatedDiagonalNegativeAngle.value = 0;
    runAnimations();
  };

  const runAnimations = useCallback(() => {
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
                    withTiming(2.5, {
                      easing: Easing.bounce,
                      reduceMotion: ReduceMotion.System,
                    })
                  );
                }
              );
            }
          )
        );
      }
    );
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      ({ screen: { height, width } }) => {
        setScreenSize({ height, width });
      }
    );
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    runAnimations();
  }, [runAnimations]);

  return (
    <View style={{ flex: 1 }}>
      {/**
       * Button
       */}
      <View
        style={[
          {
            width,
            position: "absolute",
            zIndex: 100,
            bottom: 0,
            paddingHorizontal: 20,
          },
        ]}
      >
        <Button onPress={resetAnimations} title="RESET"></Button>
      </View>

      <Animated.View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
          opacity: screenOpacity,
          // transform: [{ scale: 0.5 }],
        }}
      >
        {/**
         * Button
         */}

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
