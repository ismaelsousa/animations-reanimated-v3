import { View, Dimensions, Image } from "react-native";
import { useEffect, useMemo, useState } from "react";
import Animated, {
  Easing,
  ReduceMotion,
  useSharedValue,
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
 * 1. Show the first image
 * 2. From horizontal to full screen
 * 3. Show the second image
 * 4. From horizontal to full screen
 * 5. Rotate the diagonal from 180 to 0 based on the screen size
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

  const borderWidth = useSharedValue(0);

  const screenDiagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

  const diagonalAngleInDegrees = useMemo(() => {
    const angle = Math.atan(width / height); // divide it by 180; // Returns the arctangent of a number in radians.

    return {
      positive: convertoToStyledSheetDegrees(convertoToDegrees(angle)),
      negative: convertoToStyledSheetDegrees(convertoToDegrees(-angle)),
    };
  }, [width, height]);

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
    setTimeout(() => {
      borderWidth.value = withTiming(5, {
        // bounce
        easing: Easing.bounce,
        reduceMotion: ReduceMotion.System,
      });
    }, 1000);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        // transform: [{ scale: 0.5 }],
      }}
    >
      <View
        style={{
          zIndex: 1,
          position: "absolute",
          height,
          width,
          overflow: "hidden",
          opacity: 1,
        }}
      >
        <Animated.View // Border
          style={{
            zIndex: 2,
            justifyContent: "flex-start",
            alignItems: "flex-end",
            height: screenDiagonal,
            width,
            position: "absolute",
            bottom: 0,
            right: 0,
            transform: [{ rotate: diagonalAngleInDegrees.negative }],
            transformOrigin: "bottom right",
            overflow: "hidden",
            borderColor: "white",
            borderRightWidth: borderWidth,
            // backgroundColor: "blue",
            // opacity: 0.5,
          }}
        />
        <View
          style={{
            justifyContent: "flex-start",
            alignItems: "flex-end",
            height: screenDiagonal,
            width,
            position: "absolute",
            bottom: 0,
            right: 0,
            transform: [{ rotate: diagonalAngleInDegrees.negative }],
            transformOrigin: "bottom right",
            overflow: "hidden",
            // borderColor: "white",
            // borderRightWidth: 5,
            // backgroundColor: "blue",
            // opacity: 0.5,
          }}
        >
          <Image
            source={require("./assets/Itachi.png")}
            resizeMode="cover"
            style={{
              height: screenDiagonal,
              width,
              transform: [{ rotate: diagonalAngleInDegrees.positive }],
              transformOrigin: "bottom right",
            }}
          />
        </View>
      </View>

      {/**
       * Card 2
       */}
      <View
        style={{
          position: "absolute",
          height,
          width,
          overflow: "hidden",
        }}
      >
        <Animated.View // Border
          style={{
            zIndex: 2,
            height: screenDiagonal,
            width,
            position: "absolute",
            top: 0,
            left: 0,
            transform: [{ rotate: diagonalAngleInDegrees.negative }],
            transformOrigin: "top left",
            borderColor: "white",
            borderLeftWidth: borderWidth,
            overflow: "hidden",
            // backgroundColor: "blue",
            // opacity: 0.5,
          }}
        />
        <View
          style={{
            height: screenDiagonal,
            width,
            position: "absolute",
            top: 0,
            left: 0,
            transform: [{ rotate: diagonalAngleInDegrees.negative }],
            transformOrigin: "top left",
            // borderColor: "white",
            // borderLeftWidth: 5,
            overflow: "hidden",
            // backgroundColor: "blue",
            // opacity: 0.5,
          }}
        >
          <Image
            source={require("./assets/gaara.png")}
            resizeMode="cover"
            style={{
              height: screenDiagonal,
              width,
              transform: [{ rotate: diagonalAngleInDegrees.positive }],
              transformOrigin: "top left",
            }}
          />
        </View>
      </View>

      {/**
       * End Card 2
       */}
    </View>
  );
}
