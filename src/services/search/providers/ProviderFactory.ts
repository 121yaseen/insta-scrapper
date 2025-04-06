import { ISearchProvider } from "../interfaces/ISearchProvider";
import { ProviderConfig } from "../config/SearchConfig";
import { ImpulzeProvider } from "./ImpulzeProvider";
import { MockProvider } from "./MockProvider";
import { ModashProvider } from "./ModashProvider";

/**
 * Factory for creating search provider instances
 */
export class ProviderFactory {
  /**
   * Registry of provider constructors
   */
  private static providerRegistry: Record<
    string,
    new (config?: Record<string, any>) => ISearchProvider
  > = {
    impulze: ImpulzeProvider,
    mock: MockProvider,
    modash: ModashProvider,
  };

  /**
   * Register a new provider constructor
   * @param id Provider ID
   * @param constructor Provider constructor
   */
  public static registerProviderType(
    id: string,
    constructor: new (config?: Record<string, any>) => ISearchProvider
  ): void {
    ProviderFactory.providerRegistry[id] = constructor;
  }

  /**
   * Create a provider instance based on configuration
   * @param config Provider configuration
   * @returns Provider instance or undefined if provider type is not registered
   */
  public static createProvider(
    config: ProviderConfig
  ): ISearchProvider | undefined {
    const Constructor = ProviderFactory.providerRegistry[config.id];

    if (!Constructor) {
      console.error(`No provider constructor registered for ID: ${config.id}`);
      return undefined;
    }

    try {
      const provider = new Constructor(config.settings);

      // Override provider properties if needed
      const providerAny = provider as any;

      // Set provider enabled state based on config
      if (providerAny.isEnabled !== undefined) {
        providerAny.isEnabled = config.enabled;
      }

      // Set provider priority if it's configurable
      if (
        providerAny.priority !== undefined &&
        typeof providerAny.priority !== "string" &&
        !Object.isFrozen(provider)
      ) {
        providerAny.priority = config.priority;
      }

      return provider;
    } catch (error) {
      console.error(`Error creating provider ${config.id}:`, error);
      return undefined;
    }
  }

  /**
   * Create multiple provider instances from configurations
   * @param configs Array of provider configurations
   * @returns Array of successfully created provider instances
   */
  public static createProviders(configs: ProviderConfig[]): ISearchProvider[] {
    const providers: ISearchProvider[] = [];

    for (const config of configs) {
      const provider = ProviderFactory.createProvider(config);
      if (provider) {
        providers.push(provider);
      }
    }

    return providers;
  }
}
