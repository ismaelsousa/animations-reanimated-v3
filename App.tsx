import { View, Dimensions, TouchableOpacity, Text } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  ReduceMotion,
  runOnJS,
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

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
    const angle = Math.atan(width / height); // Returns the arctangent of a number in radians.

    return {
      positive: convertoToDegrees(angle),
      negative: convertoToDegrees(-angle),
    };
  }, [width, height]);

  const [showResetButton, setShowResetButton] = useState<boolean>(false);

  const gyroscope = useAnimatedSensor(SensorType.ACCELEROMETER, {
    interval: 100,
  });

  const values = useDerivedValue(() => {
    const { x, y, z } = gyroscope.sensor.value;

    const rollAngle = x * (180 / Math.PI);
    const pitchAngle = y * (180 / Math.PI);

    return { roll: rollAngle, pitch: pitchAngle };
  });

  const cardScale = useSharedValue(1);
  const screenOpacity = useSharedValue(1);
  const borderWidth = useSharedValue(0);
  const secondCardOpacity = useSharedValue(0);
  const firstCardTranslateX = useSharedValue(width * -1);
  const animatedDiagonalPositiveAngle = useSharedValue(0);
  const animatedDiagonalNegativeAngle = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateX: withSpring(
            `${interpolate(
              values.value.pitch,
              [-90, 90],
              [-20, 20],
              Extrapolation.CLAMP
            )}deg`
          ),
        },
        {
          rotateY: withSpring(
            `${interpolate(
              values.value.roll,
              [-90, 90],
              [-20, 20],
              Extrapolation.CLAMP
            )}deg`
          ),
        },
        { scale: cardScale.value },
      ],
    };
  }, []);

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

  const invokeResetButtonTimeoutCallback = () => {
    "worklet";
    return () => {
      runOnJS(resetButtonTimeoutCallback)();
    };
  };

  const animateScreenOpacity = () => {
    "worklet";
    return () => {
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
    };
  };

  const animateOpacityAndBorder = () => {
    "worklet";
    const config = {
      easing: Easing.bounce,
      reduceMotion: ReduceMotion.System,
    };

    borderWidth.value = withSequence(
      withTiming(10, config),
      withTiming(0, config),
      withTiming(
        height,
        {
          ...config,
          easing: Easing.elastic(5),
        },
        animateScreenOpacity()
      ),
      withTiming(2.5, config, () => {
        cardScale.value = withTiming(
          0.8,
          {
            duration: 1000,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.System,
          },
          invokeResetButtonTimeoutCallback()
        );
      })
    );
  };

  const degreeAnimation = () => {
    "worklet";
    animatedDiagonalPositiveAngle.value = withDelay(
      500,
      withTiming(
        diagonalAngleInDegrees.positive,
        {
          duration: 500,
          easing: Easing.bounce,
          reduceMotion: ReduceMotion.System,
        },
        animateOpacityAndBorder
      )
    );

    animatedDiagonalNegativeAngle.value = withDelay(
      500,
      withTiming(diagonalAngleInDegrees.negative, {
        duration: 500,
        easing: Easing.bounce,
        reduceMotion: ReduceMotion.System,
      })
    );
  };

  const applyAnimations = () => {
    "worklet";

    firstCardTranslateX.value = withDelay(
      1000,
      withTiming(
        0,
        {
          duration: 500,
          easing: Easing.inOut(Easing.circle),
          reduceMotion: ReduceMotion.System,
        },
        degreeAnimation
      )
    );
  };

  const runAnimations = useCallback(() => {
    setShowResetButton(false);

    // reset all the values
    cardScale.value = 1;
    screenOpacity.value = 1;
    borderWidth.value = 0;
    secondCardOpacity.value = 0;
    firstCardTranslateX.value = width * -1;
    animatedDiagonalPositiveAngle.value = 0;
    animatedDiagonalNegativeAngle.value = 0;

    secondCardOpacity.value = withTiming(
      1,
      {
        duration: 600,
        easing: Easing.bounce,
        reduceMotion: ReduceMotion.System,
      },
      applyAnimations
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
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "black",
      }}
    >
      <StatusBar translucent />
      <Animated.View
        style={[
          {
            height,
            width,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "black",
            opacity: screenOpacity,
            overflow: "hidden",
            borderRadius: 20,
          },
          animatedStyle,
        ]}
      >
        <Animated.View // Border
          style={[
            {
              zIndex: 2,
              height: screenDiagonal,
              width: borderWidth,
              position: "absolute",
              transformOrigin: "center",
              overflow: "hidden",
              backgroundColor: "white",
            },
            diagonalNegativeStyle,
          ]}
        />

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
            },
            firstCardContainerStyle,
          ]}
        >
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
          <Animated.View
            style={[
              {
                height: screenDiagonal,
                width,
                position: "absolute",
                top: 0,
                left: 0,
                transformOrigin: "top left",
                overflow: "hidden",
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
