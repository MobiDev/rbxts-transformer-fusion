import Fusion, { Computed, State, Tween } from "@rbxts/fusion";
function instructions() {
	return <textlabel Text="changeme123" ></textlabel>;
}

function button() {
	const state = State(0);
	const computed = Computed(() => tostring(state.get()));
	const MouseButton1Click = () => state.set(state.get() + 1);
	return (
		<textbutton
			Size={new UDim2(0, 160, 0, 40)}
			Text={computed}
			OnEvent={{
				MouseButton1Click,
			}}
		/>
	);
}

export = (gui: GuiObject) => {
	return (
		<frame Parent={gui}>
			{button()}
			{instructions()}
		</frame>
	);
};

const prop = { Name: "Test" };
