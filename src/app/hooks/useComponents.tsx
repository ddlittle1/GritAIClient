import ComponentTypes from "../assets/data/componentTypes";

export interface ComponentTypes {
  id: number;
  name: string;
  icon: string;
}

const useComponentTypes = () => ({
  dat: ComponentTypes,
  isLoading: false,
  error: null,
  icon: "",
});

export default useComponentTypes;
