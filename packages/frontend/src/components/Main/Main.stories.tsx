import { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";

import { Main as Component } from "./Main";

export default {
  title: "Components/Main",
  component: Component,
} as ComponentMeta<typeof Component>;

const Template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Main = Template.bind({});
