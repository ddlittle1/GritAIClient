import ComponentTypes from "../assets/data/componentTypes";

export interface ComponentTypes {
  id: number;
  name: string;
}

const useComponentTypes = () => ({
  data: ComponentTypes,
  isLoading: false,
  error: null,
});

export default useComponentTypes;
