// src/services/addressService.ts
export interface EnderecoResponse {
  cep: string;
  street: string;
  city: string;
  neighborhood: string;
  state: string;
  service: string;
}

export interface BuscaEnderecoParams {
  uf?: string;
  city?: string;
  street?: string;
  cep?: string;
}

class AddressService {
  private static instance: AddressService;
  
  private constructor() {}
  
  static getInstance() {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  /**
   * Busca por CEP usando BrasilAPI (principal)
   */
  async buscarPorCep(cep: string): Promise<EnderecoResponse | null> {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return null;

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
      if (!response.ok) throw new Error('CEP não encontrado');
      
      const data = await response.json();
      return {
        cep: data.cep,
        street: data.street,
        city: data.city,
        neighborhood: data.neighborhood,
        state: data.state,
        service: 'brasilapi'
      };
    } catch (error) {
      console.error('Erro na BrasilAPI:', error);
      return this.buscarPorCepFallback(cep);
    }
  }

  /**
   * Busca por CEP usando ViaCEP (fallback)
   */
  private async buscarPorCepFallback(cep: string): Promise<EnderecoResponse | null> {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error('CEP não encontrado no ViaCEP');
      
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado');
      
      return {
        cep: data.cep.replace(/\D/g, ''),
        street: data.logradouro,
        city: data.localidade,
        neighborhood: data.bairro,
        state: data.uf,
        service: 'viacep'
      };
    } catch (error) {
      console.error('Erro no ViaCEP:', error);
      return null;
    }
  }

  /**
   * Busca por endereço (rua, cidade, UF)
   * Usa múltiplas APIs para melhor cobertura
   */
  async buscarPorEndereco(params: BuscaEnderecoParams): Promise<EnderecoResponse[]> {
    const results: EnderecoResponse[] = [];
    
    // Buscar no ViaCEP (suporta busca por endereço)
    if (params.uf && params.city && params.street) {
      try {
        const viaCepResults = await this.buscarPorEnderecoViaCep(params);
        results.push(...viaCepResults);
      } catch (error) {
        console.error('Erro na busca por endereço ViaCEP:', error);
      }
    }
    
    // Buscar no OpenCEP (fallback)
    if (results.length === 0 && params.street) {
      try {
        const openCepResults = await this.buscarPorEnderecoOpenCep(params);
        results.push(...openCepResults);
      } catch (error) {
        console.error('Erro na busca por endereço OpenCEP:', error);
      }
    }
    
    return results;
  }

  /**
   * Busca por endereço usando ViaCEP
   * Formato: https://viacep.com.br/ws/{UF}/{Cidade}/{Logradouro}/json/
   */
  private async buscarPorEnderecoViaCep(params: BuscaEnderecoParams): Promise<EnderecoResponse[]> {
    const { uf, city, street } = params;
    if (!uf || !city || !street) return [];
    
    const ufLimpo = uf.toUpperCase();
    const cityLimpa = this.sanitizarTexto(city);
    const streetLimpa = this.sanitizarTexto(street);
    
    const url = `https://viacep.com.br/ws/${ufLimpo}/${cityLimpa}/${streetLimpa}/json/`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro na busca');
      
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      
      return data.map(item => ({
        cep: item.cep.replace(/\D/g, ''),
        street: item.logradouro,
        city: item.localidade,
        neighborhood: item.bairro,
        state: item.uf,
        service: 'viacep'
      }));
    } catch (error) {
      console.error('Erro na busca ViaCEP:', error);
      return [];
    }
  }

  /**
   * Busca por endereço usando OpenCEP
   */
  private async buscarPorEnderecoOpenCep(params: BuscaEnderecoParams): Promise<EnderecoResponse[]> {
    const { uf, city, street } = params;
    const query = `${street}, ${city}, ${uf}`;
    
    try {
      const response = await fetch(`https://opencep.com/v1/${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Erro na busca');
      
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      
      return data.map(item => ({
        cep: item.cep.replace(/\D/g, ''),
        street: item.logradouro,
        city: item.cidade,
        neighborhood: item.bairro,
        state: item.uf,
        service: 'opencep'
      }));
    } catch (error) {
      console.error('Erro na busca OpenCEP:', error);
      return [];
    }
  }

  /**
   * Busca por CEP a partir de coordenadas (geolocalização)
   */
  async buscarPorCoordenadas(lat: number, lng: number): Promise<EnderecoResponse | null> {
    try {
      // Usar Nominatim (OpenStreetMap) para reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Erro na geocodificação');
      
      const data = await response.json();
      const address = data.address;
      
      // Extrair CEP do resultado
      const cep = address.postcode?.replace(/\D/g, '');
      if (!cep) return null;
      
      // Buscar o endereço completo pelo CEP
      return this.buscarPorCep(cep);
    } catch (error) {
      console.error('Erro na busca por coordenadas:', error);
      return null;
    }
  }

  /**
   * Auto-complete para endereços
   */
  async autocompleteEndereco(query: string): Promise<Array<{ label: string; value: string }>> {
    if (query.length < 3) return [];
    
    try {
      // Usar API do Google Places (requer API key)
      // Ou usar serviço alternativo como Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.map((item: any) => ({
        label: item.display_name,
        value: item.osm_id
      }));
    } catch (error) {
      console.error('Erro no autocomplete:', error);
      return [];
    }
  }

  private sanitizarTexto(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const addressService = AddressService.getInstance();